package com.metropolisparking.services

import com.metropolisparking.{TestDbSpec, TestFixtures}
import com.metropolisparking.dto.PaymentProcessRequest
import com.metropolisparking.exceptions.{ConflictException, NotFoundException}
import com.metropolisparking.models.Payment
import com.metropolisparking.repositories._
import org.scalatest.funspec.AnyFunSpec
import org.scalatest.matchers.should.Matchers
import java.util.UUID

class PaymentServiceSpec extends AnyFunSpec with Matchers with TestDbSpec {

  val paymentRepo  = new PaymentRepository(dslContext)
  val auditLogRepo = new AuditLogRepository(dslContext)

  val auditLogService = new AuditLogService(auditLogRepo)
  val paymentService  = new PaymentService(paymentRepo, auditLogService)

  describe("PaymentService") {
    it("processes a PENDING payment and updates status to SUCCESS") {
      val lot = TestFixtures.aLot(dslContext)
      val level = TestFixtures.aLevel(dslContext, lot.id)
      val space = TestFixtures.aSpace(dslContext, lot.id, level.id)
      val session = TestFixtures.aSession(dslContext, space.id)

      val payment = paymentRepo.create(Payment(UUID.randomUUID(), session.id, BigDecimal("15.50"), "CASH", "PENDING"))

      val processed = paymentService.processPayment(payment.id, PaymentProcessRequest("CARD"), None)

      processed.status shouldBe "SUCCESS"
      processed.method shouldBe "CARD"
      processed.amount shouldBe BigDecimal("15.50")
    }

    it("throws ConflictException when processing an already settled payment") {
      val lot = TestFixtures.aLot(dslContext)
      val level = TestFixtures.aLevel(dslContext, lot.id)
      val space = TestFixtures.aSpace(dslContext, lot.id, level.id)
      val session = TestFixtures.aSession(dslContext, space.id)

      val payment = paymentRepo.create(Payment(UUID.randomUUID(), session.id, BigDecimal("10.00"), "CARD", "SUCCESS"))

      intercept[ConflictException] {
        paymentService.processPayment(payment.id, PaymentProcessRequest("CARD"), None)
      }
    }

    it("throws NotFoundException for non-existent payment ID") {
      intercept[NotFoundException] {
        paymentService.processPayment(UUID.randomUUID(), PaymentProcessRequest("CARD"), None)
      }
    }

    it("lists all created payments") {
      val lot = TestFixtures.aLot(dslContext)
      val level = TestFixtures.aLevel(dslContext, lot.id)
      val space = TestFixtures.aSpace(dslContext, lot.id, level.id)
      val session = TestFixtures.aSession(dslContext, space.id)

      paymentRepo.create(Payment(UUID.randomUUID(), session.id, BigDecimal("20.00"), "UPI", "PENDING"))

      val list = paymentService.list()
      list should not be empty
    }
  }
}
