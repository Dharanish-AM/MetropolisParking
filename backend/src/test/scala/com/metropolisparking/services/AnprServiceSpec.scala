package com.metropolisparking.services

import com.metropolisparking.{TestDbSpec, TestFixtures}
import com.metropolisparking.dto.{AnprEntryRequest, AnprExitRequest}
import com.metropolisparking.exceptions.{ConflictException, NotFoundException}
import com.metropolisparking.repositories._
import org.scalatest.funspec.AnyFunSpec
import org.scalatest.matchers.should.Matchers

class AnprServiceSpec extends AnyFunSpec with Matchers with TestDbSpec {

  val lotRepo         = new ParkingLotRepository(dslContext)
  val vehicleRepo     = new VehicleRepository(dslContext)
  val sessionRepo     = new ParkingSessionRepository(dslContext)
  val paymentRepo     = new PaymentRepository(dslContext)
  val pricingRuleRepo = new PricingRuleRepository(dslContext)
  val auditLogRepo    = new AuditLogRepository(dslContext)

  val auditLogService = new AuditLogService(auditLogRepo)
  val vehicleService  = new VehicleService(vehicleRepo, auditLogService)
  val paymentService  = new PaymentService(paymentRepo, auditLogService)
  val sessionService  = new ParkingSessionService(sessionRepo, lotRepo, vehicleService, pricingRuleRepo, paymentRepo, auditLogService)
  val anprService     = new AnprService(lotRepo, paymentRepo, vehicleService, sessionService, paymentService)

  describe("AnprService") {
    it("assigns first AVAILABLE space in lot and marks it OCCUPIED") {
      val lot = TestFixtures.aLot(dslContext)
      val level = TestFixtures.aLevel(dslContext, lot.id)
      val space = TestFixtures.aSpace(dslContext, lot.id, level.id)

      val res = anprService.simulateEntry(AnprEntryRequest("MH12AB1234", lot.id))
      res.plateNumber shouldBe "MH12AB1234"

      val updatedSpace = lotRepo.findSpaceById(space.id).get
      updatedSpace.status shouldBe "OCCUPIED"
    }

    it("throws ConflictException when all spaces in the lot are OCCUPIED") {
      val lot = TestFixtures.aLot(dslContext)
      val level = TestFixtures.aLevel(dslContext, lot.id)
      TestFixtures.aSpace(dslContext, lot.id, level.id, status = "OCCUPIED")

      intercept[ConflictException] {
        anprService.simulateEntry(AnprEntryRequest("MH12AB1234", lot.id))
      }
    }

    it("normalises license plates to uppercase without spaces") {
      val lot = TestFixtures.aLot(dslContext)
      val level = TestFixtures.aLevel(dslContext, lot.id)
      TestFixtures.aSpace(dslContext, lot.id, level.id)

      val res = anprService.simulateEntry(AnprEntryRequest("mh 12 ab 1234", lot.id))
      res.plateNumber shouldBe "MH12AB1234"
    }

    it("exits session cleanly, returns space to AVAILABLE, and settles payment") {
      val lot = TestFixtures.aLot(dslContext)
      val level = TestFixtures.aLevel(dslContext, lot.id)
      val space = TestFixtures.aSpace(dslContext, lot.id, level.id)

      anprService.simulateEntry(AnprEntryRequest("MH12AB1234", lot.id))

      val exitRes = anprService.simulateExit(AnprExitRequest("MH12AB1234"))
      exitRes.plateNumber shouldBe "MH12AB1234"
      exitRes.paymentStatus shouldBe "SUCCESS"

      val updatedSpace = lotRepo.findSpaceById(space.id).get
      updatedSpace.status shouldBe "AVAILABLE"
    }

    it("throws NotFoundException when exiting with unknown plate") {
      intercept[NotFoundException] {
        anprService.simulateExit(AnprExitRequest("UNKNOWN9999"))
      }
    }

    it("throws NotFoundException when trying to exit an already exited vehicle") {
      val lot = TestFixtures.aLot(dslContext)
      val level = TestFixtures.aLevel(dslContext, lot.id)
      TestFixtures.aSpace(dslContext, lot.id, level.id)

      anprService.simulateEntry(AnprEntryRequest("MH12AB1234", lot.id))
      anprService.simulateExit(AnprExitRequest("MH12AB1234"))

      intercept[NotFoundException] {
        anprService.simulateExit(AnprExitRequest("MH12AB1234"))
      }
    }
  }
}
