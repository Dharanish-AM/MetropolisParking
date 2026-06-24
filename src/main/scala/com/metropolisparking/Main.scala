package com.metropolisparking

import akka.actor.ActorSystem
import akka.http.scaladsl.Http
import com.metropolisparking.config.AppConfig
import com.metropolisparking.repositories.JooqParkingRepository
import com.metropolisparking.routes.HealthRoute
import com.zaxxer.hikari.{HikariConfig, HikariDataSource}
import org.flywaydb.core.Flyway
import org.jooq.SQLDialect
import org.jooq.impl.DSL
import org.slf4j.LoggerFactory
import scala.concurrent.{Await, ExecutionContext, Future}
import scala.concurrent.duration.Duration
import scala.util.{Failure, Success}

object Main {
  private val logger = LoggerFactory.getLogger(Main.getClass)

  def main(args: Array[String]): Unit = {
    // 1. Load application configurations driven by environment
    val config = AppConfig.load()
    
    logger.info(s"Starting Metropolis Parking backend in environment: ${config.app.environment}")
    
    // 2. Initialize HikariCP Database Connection Pool
    logger.info("Initializing connection pool...")
    val hikariConfig = new HikariConfig()
    hikariConfig.setDriverClassName(config.db.driver)
    hikariConfig.setJdbcUrl(config.db.url)
    config.db.user.foreach(hikariConfig.setUsername)
    config.db.password.foreach(hikariConfig.setPassword)
    hikariConfig.setMaximumPoolSize(config.db.numThreads)
    
    val dataSource = new HikariDataSource(hikariConfig)
    
    // 3. Run Flyway Database Migrations
    logger.info("Running database migrations via Flyway...")
    val flyway = Flyway.configure()
      .dataSource(dataSource)
      // Allow out of order in case tests and local schema runs overlap
      .outOfOrder(true)
      .load()
    val migrationResult = flyway.migrate()
    logger.info(s"Database migrations completed. Executed ${migrationResult.migrationsExecuted} migrations.")
    
    // 4. Initialize jOOQ DSLContext
    val dialect = if (config.db.driver.contains("h2")) SQLDialect.H2 else SQLDialect.POSTGRES
    val dslContext = DSL.using(dataSource, dialect)
    
    // 5. Setup dedicated ExecutionContext to avoid blocking CPU / HTTP thread pool
    val dbExecutor = java.util.concurrent.Executors.newFixedThreadPool(config.db.numThreads)
    val dbExecutionContext = ExecutionContext.fromExecutor(dbExecutor)
    
    // 6. Initialize repository layer
    val parkingRepository = new JooqParkingRepository(dslContext)(dbExecutionContext)
    
    // 7. Bootstrap Akka ActorSystem & ExecutionContext
    implicit val system: ActorSystem = ActorSystem("metropolis-parking-system")
    implicit val ec: ExecutionContext = system.dispatcher
    
    // 8. Initialize routes (only HealthRoute for Deliver 1)
    val checkDb = () => Future {
      dslContext.execute("SELECT 1")
      true
    }(dbExecutionContext).recover {
      case ex: Throwable =>
        logger.error("Database health check failed", ex)
        false
    }
    val healthRoute = new HealthRoute(checkDb).route
    
    // 9. Bind HTTP server to target host and port
    val bindingFuture = Http()
      .newServerAt(config.http.host, config.http.port)
      .bind(healthRoute)
      
    bindingFuture.onComplete {
      case Success(binding) =>
        val address = binding.localAddress
        val displayHost = if (config.http.host == "0.0.0.0" || config.http.host == "0:0:0:0:0:0:0:0") "localhost" else address.getHostString
        logger.info(s"Server online at http://$displayHost:${address.getPort}/")
      case Failure(ex) =>
        logger.error(s"Failed to bind HTTP endpoint to ${config.http.host}:${config.http.port}. Shutting down...", ex)
        system.terminate()
        dataSource.close()
        dbExecutor.shutdown()
    }
    
    // 10. Setup JVM shutdown hook for graceful termination
    sys.addShutdownHook {
      logger.info("Shutdown signal received. Initiating graceful termination...")
      bindingFuture
        .flatMap(_.unbind())
        .onComplete { _ =>
          system.terminate()
          dataSource.close()
          dbExecutor.shutdown()
          logger.info("HTTP server unbound. Database pool closed. Actor system terminated. Goodbye.")
        }
    }

    // Keep JVM alive until ActorSystem terminates
    Await.result(system.whenTerminated, Duration.Inf)
  }
}
