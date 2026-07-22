package com.metropolisparking.services

import com.metropolisparking.TestDbSpec
import com.metropolisparking.dto._
import com.metropolisparking.exceptions.ConflictException
import com.metropolisparking.repositories._
import org.scalatest.funspec.AnyFunSpec
import org.scalatest.matchers.should.Matchers
import java.util.UUID

class ParkingSessionServiceSpec extends AnyFunSpec with Matchers with TestDbSpec {
  val lotRepo = new ParkingLotRepository(dslContext)
  val vehicleRepo = new VehicleRepository(dslContext)
  val sessionRepo = new ParkingSessionRepository(dslContext)
  val pricingRuleRepo = new PricingRuleRepository(dslContext)
  val paymentRepo = new PaymentRepository(dslContext)
  val auditLogRepo = new AuditLogRepository(dslContext)

  val auditLogService = new AuditLogService(auditLogRepo)
  val lotService = new ParkingLotService(lotRepo, auditLogService)
  val vehicleService = new VehicleService(vehicleRepo, auditLogService)
  val sessionService = new ParkingSessionService(
    sessionRepo, lotRepo, vehicleService, pricingRuleRepo, paymentRepo, auditLogService
  )

  describe("ParkingSessionService") {
    it("should start and end parking session with correct status transitions and fee calculation") {
      val lot = lotService.createLot(ParkingLotCreateRequest("Mall Lot", "City Center"), None)
      val level = lotService.createLevel(lot.id, 1, None)
      val space = lotService.createSpace(ParkingSpaceCreateRequest(lot.id, level.id, s"S-${UUID.randomUUID().toString.take(6)}", "CAR"), None)

      val plate = s"MH12-${UUID.randomUUID().toString.take(4).toUpperCase}"

      val session = sessionService.startSession(SessionStartRequest(plate, space.id), None)
      session.vehicleId should not be null
      session.spaceId shouldBe space.id

      val activeSpace = lotService.getSpace(space.id).get
      activeSpace.status shouldBe "OCCUPIED"

      intercept[ConflictException] {
        sessionService.startSession(SessionStartRequest(plate, space.id), None)
      }

      val endedSession = sessionService.endSession(SessionEndRequest(plate), None)
      endedSession.id shouldBe session.id
      endedSession.fee.get shouldBe BigDecimal("5.00")

      val exitSpace = lotService.getSpace(space.id).get
      exitSpace.status shouldBe "AVAILABLE"

      val payment = paymentRepo.findBySessionId(session.id).get
      payment.status shouldBe "PENDING"
      payment.amount shouldBe BigDecimal("5.00")
    }
  }
}
