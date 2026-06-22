package com.metropolisparking

import org.apache.pekko.actor.ActorSystem
import org.apache.pekko.http.scaladsl.Http
import com.metropolisparking.config.AppConfig
import com.metropolisparking.routes.HealthRoute
import org.slf4j.LoggerFactory
import scala.concurrent.ExecutionContext
import scala.util.{Failure, Success}

object Main {
  private val logger = LoggerFactory.getLogger(Main.getClass)

  def main(args: Array[String]): Unit = {
    // 1. Load application configurations driven by environment
    val config = AppConfig.load()
    
    logger.info(s"Starting Metropolis Parking backend in environment: ${config.app.environment}")
    
    // 2. Bootstrap Pekko ActorSystem & ExecutionContext
    implicit val system: ActorSystem = ActorSystem("metropolis-parking-system")
    implicit val ec: ExecutionContext = system.dispatcher
    
    // 3. Initialize routes (only HealthRoute for Deliver 1)
    val healthRoute = new HealthRoute().route
    
    // 4. Bind HTTP server to target host and port
    val bindingFuture = Http()
      .newServerAt(config.http.host, config.http.port)
      .bind(healthRoute)
      
    bindingFuture.onComplete {
      case Success(binding) =>
        val address = binding.localAddress
        logger.info(s"Server online at http://${address.getHostString}:${address.getPort}/")
      case Failure(ex) =>
        logger.error(s"Failed to bind HTTP endpoint to ${config.http.host}:${config.http.port}. Shutting down...", ex)
        system.terminate()
    }
    
    // 5. Setup JVM shutdown hook for graceful termination
    sys.addShutdownHook {
      logger.info("Shutdown signal received. Initiating graceful termination...")
      bindingFuture
        .flatMap(_.unbind())
        .onComplete { _ =>
          system.terminate()
          logger.info("HTTP server unbound. Actor system terminated. Goodbye.")
        }
    }
  }
}
