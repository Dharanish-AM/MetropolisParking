package com.metropolisparking

import akka.http.scaladsl.model.headers.RawHeader
import akka.http.scaladsl.server.{ExceptionHandler, RejectionHandler, Route}
import akka.http.scaladsl.testkit.ScalatestRouteTest
import com.metropolisparking.exceptions.GlobalErrorHandler
import com.metropolisparking.middleware.RbacMiddleware
import com.metropolisparking.repositories._
import com.metropolisparking.security.SecurityModule
import com.metropolisparking.services._
import org.scalatest.funspec.AnyFunSpec
import org.scalatest.matchers.should.Matchers

trait BaseRoutesSpec extends AnyFunSpec with Matchers with ScalatestRouteTest with TestDbSpec {

  val jwtSecret = "test-secret-key-that-is-long-enough-for-jwt-signing"
  val securityModule = new SecurityModule(jwtSecret)
  val rbacMiddleware = new RbacMiddleware(securityModule)

  val userRepo        = new UserRepository(dslContext)
  val lotRepo         = new ParkingLotRepository(dslContext)
  val vehicleRepo     = new VehicleRepository(dslContext)
  val sessionRepo     = new ParkingSessionRepository(dslContext)
  val paymentRepo     = new PaymentRepository(dslContext)
  val pricingRuleRepo = new PricingRuleRepository(dslContext)
  val auditLogRepo    = new AuditLogRepository(dslContext)
  val reservationRepo = new ReservationRepository(dslContext)

import akka.actor.typed.scaladsl.adapter._
  implicit val typedSystem: akka.actor.typed.ActorSystem[Nothing] = system.toTyped

  val auditLogService   = new AuditLogService(auditLogRepo)
  val authService       = new AuthService(userRepo, securityModule, auditLogService)
  val wsService         = new WebSocketService
  val lotService        = new ParkingLotService(lotRepo, auditLogService, sessionRepo, reservationRepo, vehicleRepo, userRepo, wsService)
  val vehicleService    = new VehicleService(vehicleRepo, auditLogService)
  val sessionService    = new ParkingSessionService(sessionRepo, lotRepo, vehicleService, pricingRuleRepo, paymentRepo, auditLogService, wsService)
  val paymentService    = new PaymentService(paymentRepo, auditLogService)
  val dashboardService  = new DashboardService(dslContext, None)
  val reservationService= new ReservationService(reservationRepo, lotRepo, pricingRuleRepo, auditLogService, wsService)
  val anprService       = new AnprService(lotRepo, paymentRepo, vehicleService, sessionService, paymentService, wsService)
  val qrService         = new QrService(sessionService, reservationService, sessionRepo, reservationRepo, lotRepo, vehicleService, jwtSecret)

  implicit val exHandler: ExceptionHandler  = GlobalErrorHandler.exceptionHandler
  implicit val rejHandler: RejectionHandler = GlobalErrorHandler.rejectionHandler

  def authHeader(userId: String, role: String): RawHeader = {
    val token = securityModule.generateToken(userId, role, expireDurationSeconds = 3600)
    RawHeader("Authorization", s"Bearer $token")
  }

  def seal(route: Route): Route = Route.seal(route)
}
