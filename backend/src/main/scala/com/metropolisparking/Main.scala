package com.metropolisparking

import akka.actor.typed.ActorSystem
import akka.actor.typed.scaladsl.Behaviors
import akka.actor.typed.scaladsl.adapter._
import akka.http.scaladsl.Http
import akka.http.scaladsl.server.Directives._
import com.metropolisparking.config.AppConfig
import com.metropolisparking.exceptions.GlobalErrorHandler
import com.metropolisparking.middleware.{LoggingMiddleware, RbacMiddleware}
import com.metropolisparking.repositories._
import com.metropolisparking.routes._
import com.metropolisparking.security.SecurityModule
import com.metropolisparking.services._
import org.flywaydb.core.Flyway
import scala.concurrent.ExecutionContextExecutor
import scala.util.{Failure, Success, Try}

object Main {
  def main(args: Array[String]): Unit = {
    implicit val system: ActorSystem[Nothing] = ActorSystem(Behaviors.empty, "metropolis-parking-system")
    implicit val executionContext: ExecutionContextExecutor = system.executionContext
    val classicSystem: akka.actor.ActorSystem = system.toClassic

    val config = AppConfig.load()

    try {
      val flyway = Flyway.configure()
        .dataSource(config.db.url, config.db.username, config.db.password)
        .load()
      flyway.migrate()
      system.log.info("Database migration completed successfully")
    } catch {
      case ex: Throwable =>
        system.log.error("Failed to run database migrations, terminating", ex)
        system.terminate()
        sys.exit(1)
    }

    val redisHost = sys.env.getOrElse("REDIS_HOST", "localhost")
    val redisPort = sys.env.get("REDIS_PORT").flatMap(p => Try(p.toInt).toOption).getOrElse(6379)
    val redisService = Try(new RedisService(redisHost, redisPort)).toOption

    val dataSource = DbConnection.createDataSource(config.db)
    val dslContext = DbConnection.createDslContext(dataSource)
    val securityModule = new SecurityModule(config.jwt.secret)
    val rbacMiddleware = new RbacMiddleware(securityModule)

    val userRepo = new UserRepository(dslContext)
    val lotRepo = new ParkingLotRepository(dslContext)
    val vehicleRepo = new VehicleRepository(dslContext)
    val sessionRepo = new ParkingSessionRepository(dslContext)
    val paymentRepo = new PaymentRepository(dslContext)
    val pricingRuleRepo = new PricingRuleRepository(dslContext)
    val auditLogRepo = new AuditLogRepository(dslContext)
    val reservationRepo = new ReservationRepository(dslContext)

    val auditLogService = new AuditLogService(auditLogRepo)
    val authService = new AuthService(userRepo, securityModule, auditLogService)
    val wsService = new WebSocketService
    val lotService = new ParkingLotService(lotRepo, auditLogService, wsService)
    val vehicleService = new VehicleService(vehicleRepo, auditLogService)
    val sessionService = new ParkingSessionService(sessionRepo, lotRepo, vehicleService, pricingRuleRepo, paymentRepo, auditLogService, wsService)
    val paymentService = new PaymentService(paymentRepo, auditLogService)
    val dashboardService = new DashboardService(dslContext, redisService)
    val reservationService = new ReservationService(reservationRepo, lotRepo, pricingRuleRepo, auditLogService, wsService)
    val anprService = new AnprService(lotRepo, paymentRepo, vehicleService, sessionService, paymentService, wsService)
    val qrService = new QrService(sessionService, reservationService, sessionRepo, reservationRepo, lotRepo, vehicleService, config.jwt.secret)

    val backgroundScheduler = new BackgroundJobScheduler(dslContext, wsService, redisService)(classicSystem, executionContext)
    backgroundScheduler.start()

    val authRoutes = new AuthRoutes(authService, rbacMiddleware)
    val lotRoutes = new ParkingLotRoutes(lotService, rbacMiddleware)
    val spaceRoutes = new ParkingSpaceRoutes(lotService, rbacMiddleware)
    val vehicleRoutes = new VehicleRoutes(vehicleService, rbacMiddleware)
    val sessionRoutes = new ParkingSessionRoutes(sessionService, rbacMiddleware)
    val paymentRoutes = new PaymentRoutes(paymentService, rbacMiddleware)
    val dashboardRoutes = new DashboardRoutes(dashboardService, rbacMiddleware)
    val wsRoutes = new WebSocketRoutes(wsService)
    val docRoutes = new DocRoutes
    val reservationRoutes = new ReservationRoutes(reservationService, rbacMiddleware)
    val anprRoutes = new AnprRoutes(anprService, rbacMiddleware)
    val qrRoutes = new QrRoutes(qrService, rbacMiddleware)

    val healthRoute =
      path("health") {
        get {
          complete("OK")
        }
      }

    val combinedRoutes =
      healthRoute ~
      authRoutes.routes ~
      lotRoutes.routes ~
      spaceRoutes.routes ~
      vehicleRoutes.routes ~
      sessionRoutes.routes ~
      paymentRoutes.routes ~
      dashboardRoutes.routes ~
      wsRoutes.routes ~
      docRoutes.routes ~
      reservationRoutes.routes ~
      anprRoutes.routes ~
      qrRoutes.routes

    val finalRoute = handleExceptions(GlobalErrorHandler.exceptionHandler) {
      handleRejections(GlobalErrorHandler.rejectionHandler) {
        LoggingMiddleware.correlationIdDirective {
          com.metropolisparking.middleware.CorsMiddleware.corsHandler(combinedRoutes)
        }
      }
    }

    val bindingFuture = Http().newServerAt(config.http.host, config.http.port).bind(finalRoute)

    bindingFuture.onComplete {
      case Success(binding) =>
        val address = binding.localAddress
        system.log.info(s"Server online at http://${address.getHostString}:${address.getPort}/")
      case Failure(ex) =>
        system.log.error(s"Failed to bind HTTP endpoint, terminating system", ex)
        system.terminate()
    }

    scala.concurrent.Await.result(system.whenTerminated, scala.concurrent.duration.Duration.Inf)
  }
}
