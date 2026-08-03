package com.metropolisparking.services

import com.metropolisparking.{TestDbSpec, TestFixtures}
import com.metropolisparking.exceptions.ValidationException
import com.metropolisparking.repositories._
import org.scalatest.funspec.AnyFunSpec
import org.scalatest.matchers.should.Matchers
import java.util.UUID

class QrServiceSpec extends AnyFunSpec with Matchers with TestDbSpec {

  val jwtSecret = "test-secret-key-that-is-long-enough-for-jwt-signing"
  val lotRepo         = new ParkingLotRepository(dslContext)
  val vehicleRepo     = new VehicleRepository(dslContext)
  val sessionRepo     = new ParkingSessionRepository(dslContext)
  val paymentRepo     = new PaymentRepository(dslContext)
  val pricingRuleRepo = new PricingRuleRepository(dslContext)
  val auditLogRepo    = new AuditLogRepository(dslContext)
  val reservationRepo = new ReservationRepository(dslContext)

  val auditLogService   = new AuditLogService(auditLogRepo)
  val vehicleService    = new VehicleService(vehicleRepo, auditLogService)
  val paymentService    = new PaymentService(paymentRepo, auditLogService)
  val sessionService    = new ParkingSessionService(sessionRepo, lotRepo, vehicleService, pricingRuleRepo, paymentRepo, auditLogService)
  val reservationService= new ReservationService(reservationRepo, lotRepo, pricingRuleRepo, auditLogService, null)
  val qrService         = new QrService(sessionService, reservationService, sessionRepo, reservationRepo, lotRepo, vehicleService, jwtSecret)

  describe("QrService") {
    it("generates a valid QR token for a SESSION") {
      val lot = TestFixtures.aLot(dslContext)
      val level = TestFixtures.aLevel(dslContext, lot.id)
      val space = TestFixtures.aSpace(dslContext, lot.id, level.id)
      val session = TestFixtures.aSession(dslContext, space.id)

      val gen = qrService.generatePass("SESSION", session.id)
      gen.qrToken should not be empty
      gen.payload should include("SESSION")
    }

    it("generates a valid QR token for a RESERVATION") {
      val lot = TestFixtures.aLot(dslContext)
      val level = TestFixtures.aLevel(dslContext, lot.id)
      val space = TestFixtures.aSpace(dslContext, lot.id, level.id)
      val reservation = TestFixtures.aReservation(dslContext, space.id)

      val gen = qrService.generatePass("RESERVATION", reservation.id)
      gen.qrToken should not be empty
      gen.payload should include("RESERVATION")
    }

    it("scans a valid SESSION pass and triggers CHECKOUT") {
      val lot = TestFixtures.aLot(dslContext)
      val level = TestFixtures.aLevel(dslContext, lot.id)
      val space = TestFixtures.aSpace(dslContext, lot.id, level.id)
      val session = TestFixtures.aSession(dslContext, space.id)

      val gen = qrService.generatePass("SESSION", session.id)
      val scan = qrService.scanPass(gen.qrToken)

      scan.action shouldBe "CHECKOUT"
      scan.entityType shouldBe "SESSION"
    }

    it("scans a valid RESERVATION pass and triggers CHECKIN") {
      val lot = TestFixtures.aLot(dslContext)
      val level = TestFixtures.aLevel(dslContext, lot.id)
      val space = TestFixtures.aSpace(dslContext, lot.id, level.id)
      val reservation = TestFixtures.aReservation(dslContext, space.id)

      val gen = qrService.generatePass("RESERVATION", reservation.id)
      val scan = qrService.scanPass(gen.qrToken)

      scan.action shouldBe "CHECKIN"
      scan.entityType shouldBe "RESERVATION"
    }

    it("throws ValidationException for tampered QR token") {
      intercept[ValidationException] {
        qrService.scanPass("invalid.tampered.token")
      }
    }
  }
}
