package com.metropolisparking.services

import com.metropolisparking.TestDbSpec
import com.metropolisparking.dto._
import com.metropolisparking.exceptions.ConflictException
import com.metropolisparking.models.PricingRule
import com.metropolisparking.repositories._
import org.scalatest.funspec.AnyFunSpec
import org.scalatest.matchers.should.Matchers
import java.util.UUID

class ParkingSessionServiceSpec extends AnyFunSpec with Matchers with TestDbSpec {
  val lotRepo         = new ParkingLotRepository(dslContext)
  val vehicleRepo     = new VehicleRepository(dslContext)
  val sessionRepo     = new ParkingSessionRepository(dslContext)
  val pricingRuleRepo = new PricingRuleRepository(dslContext)
  val paymentRepo     = new PaymentRepository(dslContext)
  val auditLogRepo    = new AuditLogRepository(dslContext)

  val auditLogService = new AuditLogService(auditLogRepo)
  val lotService = new ParkingLotService(
    repo           = lotRepo,
    auditLogService = auditLogService,
    sessionRepo    = sessionRepo,
    vehicleRepo    = vehicleRepo
  )
  val vehicleService = new VehicleService(vehicleRepo, auditLogService)
  val sessionService = new ParkingSessionService(
    sessionRepo, lotRepo, vehicleService, pricingRuleRepo, paymentRepo, auditLogService
  )

  private def newLotWithSpace(): (UUID, UUID) = {
    val lot   = lotService.createLot(ParkingLotCreateRequest("Test Lot", "City"), None)
    val level = lotService.createLevel(lot.id, 1, None)
    val space = lotService.createSpace(
      ParkingSpaceCreateRequest(lot.id, level.id, s"S-${UUID.randomUUID().toString.take(6)}", "CAR"),
      None
    )
    (lot.id, space.id)
  }

  describe("ParkingSessionService") {
    it("should start and end parking session with correct status transitions and default fee") {
      val (_, spaceId) = newLotWithSpace()
      val plate        = s"MH12-${UUID.randomUUID().toString.take(4).toUpperCase}"

      val session = sessionService.startSession(SessionStartRequest(plate, spaceId), None)
      session.vehicleId should not be null
      session.spaceId shouldBe spaceId

      val activeSpace = lotService.getSpace(spaceId).get
      activeSpace.status shouldBe "OCCUPIED"

      val details = lotService.getSpaceDetails(spaceId)
      details.spaceId shouldBe spaceId
      details.status shouldBe "OCCUPIED"
      details.activeSession shouldBe defined
      details.activeSession.get.plateNumber shouldBe plate
      details.activeSession.get.vehicleType shouldBe "CAR"

      intercept[ConflictException] {
        sessionService.startSession(SessionStartRequest(plate, spaceId), None)
      }

      val endedSession = sessionService.endSession(SessionEndRequest(plate), None)
      endedSession.id shouldBe session.id
      endedSession.fee.get shouldBe BigDecimal("5.00")

      val exitSpace = lotService.getSpace(spaceId).get
      exitSpace.status shouldBe "AVAILABLE"

      val payment = paymentRepo.findBySessionId(session.id).get
      payment.status shouldBe "PENDING"
      payment.amount shouldBe BigDecimal("5.00")
    }

    it("should apply a lot-specific FLAT pricing rule and ignore the global default") {
      val (lotId, spaceId) = newLotWithSpace()
      val flatRule = PricingRule(
        id          = UUID.randomUUID(),
        ruleType    = "FLAT",
        rate        = BigDecimal("12.50"),
        vehicleType = None,
        lotId       = Some(lotId)
      )
      pricingRuleRepo.create(flatRule)

      val plate = s"KA01-${UUID.randomUUID().toString.take(4).toUpperCase}"
      sessionService.startSession(SessionStartRequest(plate, spaceId), None)
      val ended = sessionService.endSession(SessionEndRequest(plate), None)

      ended.fee.get shouldBe BigDecimal("12.50")
      paymentRepo.findBySessionId(ended.id).get.amount shouldBe BigDecimal("12.50")
    }

    it("should apply an HOURLY pricing rule rounding up to the nearest hour") {
      val (lotId, spaceId) = newLotWithSpace()
      val hourlyRule = PricingRule(
        id          = UUID.randomUUID(),
        ruleType    = "HOURLY",
        rate        = BigDecimal("8.00"),
        vehicleType = Some("CAR"),
        lotId       = Some(lotId)
      )
      pricingRuleRepo.create(hourlyRule)

      val plate = s"DL01-${UUID.randomUUID().toString.take(4).toUpperCase}"
      sessionService.startSession(SessionStartRequest(plate, spaceId), None)
      val ended = sessionService.endSession(SessionEndRequest(plate), None)

      // Duration is sub-minute (max(1L) floor gives 1 minute → ceil(1/60) = 1 hour)
      ended.fee.get shouldBe BigDecimal("8.00")
      paymentRepo.findBySessionId(ended.id).get.amount shouldBe BigDecimal("8.00")
    }

    it("should prefer lot+vehicleType rule over lot-only and global rules") {
      val (lotId, spaceId) = newLotWithSpace()

      // Lot-only rule ($20 FLAT) — less specific, should be overridden
      pricingRuleRepo.create(PricingRule(UUID.randomUUID(), "FLAT", BigDecimal("20.00"), None, Some(lotId)))
      // Lot+vehicleType rule ($5 FLAT) — most specific, must win
      pricingRuleRepo.create(PricingRule(UUID.randomUUID(), "FLAT", BigDecimal("5.00"), Some("CAR"), Some(lotId)))

      val plate = s"TN09-${UUID.randomUUID().toString.take(4).toUpperCase}"
      sessionService.startSession(SessionStartRequest(plate, spaceId), None)
      val ended = sessionService.endSession(SessionEndRequest(plate), None)

      ended.fee.get shouldBe BigDecimal("5.00")
    }
  }
}
