package com.metropolisparking.services

import com.metropolisparking.{TestDbSpec, TestFixtures}
import com.metropolisparking.dto.{AnprEntryRequest, AnprExitRequest}
import com.metropolisparking.repositories._
import org.scalatest.funspec.AnyFunSpec
import org.scalatest.matchers.should.Matchers

class RevenueAnalyticsServiceSpec extends AnyFunSpec with Matchers with TestDbSpec {

  val analyticsService = new RevenueAnalyticsService(dslContext)

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

  describe("RevenueAnalyticsService") {
    it("returns revenue summary and breakdowns for completed sessions") {
      val lot = TestFixtures.aLot(dslContext)
      val level = TestFixtures.aLevel(dslContext, lot.id)
      TestFixtures.aSpace(dslContext, lot.id, level.id)

      anprService.simulateEntry(AnprEntryRequest("MH12ANALYTICS", lot.id))
      anprService.simulateExit(AnprExitRequest("MH12ANALYTICS"))

      val analytics = analyticsService.getAnalytics(None)

      analytics.summary.totalSessions shouldBe >= (1L)
      analytics.summary.totalRevenue shouldBe >= (BigDecimal(0))
      analytics.lotBreakdown shouldNot be(null)
      analytics.vehicleBreakdown shouldNot be(null)
      analytics.trendPoints shouldNot be(null)
    }

    it("filters analytics by specific lot ID") {
      val lot1 = TestFixtures.aLot(dslContext, name = "Lot 1 Analytics")
      val lot2 = TestFixtures.aLot(dslContext, name = "Lot 2 Analytics")

      val analyticsLot1 = analyticsService.getAnalytics(Some(lot1.id))
      analyticsLot1.lotBreakdown.forall(_.lotId == lot1.id) shouldBe true

      val analyticsLot2 = analyticsService.getAnalytics(Some(lot2.id))
      analyticsLot2.lotBreakdown.forall(_.lotId == lot2.id) shouldBe true
    }
  }
}
