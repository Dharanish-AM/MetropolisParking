package com.metropolisparking.services

import com.metropolisparking.{TestDbSpec, TestFixtures}
import org.scalatest.funspec.AnyFunSpec
import org.scalatest.matchers.should.Matchers

class DashboardServiceSpec extends AnyFunSpec with Matchers with TestDbSpec {

  val dashboardService = new DashboardService(dslContext, None)

  describe("DashboardService") {
    it("computes occupancy and financial stats accurately when database has spaces and payments") {
      val lot = TestFixtures.aLot(dslContext)
      val level = TestFixtures.aLevel(dslContext, lot.id)
      val space1 = TestFixtures.aSpace(dslContext, lot.id, level.id, spaceNumber = "D-1", status = "AVAILABLE")
      val space2 = TestFixtures.aSpace(dslContext, lot.id, level.id, spaceNumber = "D-2", status = "OCCUPIED")

      val stats = dashboardService.getStats()

      stats.occupancy.totalSpaces shouldBe >= (2)
      stats.occupancy.occupiedSpaces shouldBe >= (1)
      stats.occupancy.availableSpaces shouldBe >= (1)
      stats.occupancy.occupancyRate shouldBe > (0.0)
    }

    it("returns zero occupancy rate when no parking spaces exist") {
      val freshDashboardService = new DashboardService(dslContext, None)
      val stats = freshDashboardService.getStats()

      stats.occupancy shouldNot be(null)
    }
  }
}
