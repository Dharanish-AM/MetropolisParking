package com.metropolisparking.services

import com.metropolisparking.TestDbSpec
import com.metropolisparking.dto.PricingRuleCreateRequest
import com.metropolisparking.repositories.{AuditLogRepository, PricingRuleRepository}
import org.scalatest.funspec.AnyFunSpec
import org.scalatest.matchers.should.Matchers
import java.time.Instant
import java.util.UUID

class PricingRuleServiceSpec extends AnyFunSpec with Matchers with TestDbSpec {
  val pricingRuleRepo = new PricingRuleRepository(dslContext)
  val auditLogRepo = new AuditLogRepository(dslContext)
  val auditLogService = new AuditLogService(auditLogRepo)
  val pricingRuleService = new PricingRuleService(pricingRuleRepo, auditLogService)

  describe("PricingRuleService") {
    it("should create, fetch, update, and delete pricing rules") {
      val createReq = PricingRuleCreateRequest(
        ruleType = "PEAK_SURGE",
        rate = BigDecimal("50.00"),
        vehicleType = Some("CAR"),
        lotId = None,
        startHour = Some(8),
        endHour = Some(18),
        occupancyThreshold = Some(75),
        surgeMultiplier = Some(BigDecimal("1.50")),
        minFee = Some(BigDecimal("10.00")),
        maxDailyCap = Some(BigDecimal("200.00"))
      )

      val rule = pricingRuleService.create(createReq, None)
      rule.rate shouldBe BigDecimal("50.00")
      rule.surgeMultiplier shouldBe BigDecimal("1.50")
      rule.startHour shouldBe 8

      val fetched = pricingRuleService.getById(rule.id)
      fetched shouldBe defined
      fetched.get.ruleType shouldBe "PEAK_SURGE"

      val updateReq = createReq.copy(rate = BigDecimal("60.00"), surgeMultiplier = Some(BigDecimal("1.75")))
      val updated = pricingRuleService.update(rule.id, updateReq, None)
      updated.rate shouldBe BigDecimal("60.00")
      updated.surgeMultiplier shouldBe BigDecimal("1.75")

      val deleted = pricingRuleService.delete(rule.id, None)
      deleted shouldBe true
      pricingRuleService.getById(rule.id) shouldBe None
    }

    it("should correctly calculate dynamic surge fees and respect max daily caps") {
      val lotId = UUID.randomUUID()
      val createReq = PricingRuleCreateRequest(
        ruleType = "PEAK_SURGE",
        rate = BigDecimal("40.00"),
        vehicleType = Some("CAR"),
        lotId = Some(lotId),
        startHour = Some(0),
        endHour = Some(24),
        occupancyThreshold = Some(50),
        surgeMultiplier = Some(BigDecimal("1.25")),
        minFee = Some(BigDecimal("15.00")),
        maxDailyCap = Some(BigDecimal("100.00"))
      )
      pricingRuleService.create(createReq, None)

      val entry = Instant.parse("2026-08-07T10:00:00Z")
      val exit = Instant.parse("2026-08-07T12:00:00Z")

      val result = pricingRuleService.calculateFee(entry, exit, lotId, "CAR", occupancyPct = 60.0)
      result.durationMinutes shouldBe 120
      result.baseFee shouldBe BigDecimal("80.00")
      result.surgeMultiplier shouldBe BigDecimal("1.25")
      result.finalFee shouldBe BigDecimal("100.00")
    }
  }
}
