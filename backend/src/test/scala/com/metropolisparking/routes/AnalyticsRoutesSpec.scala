package com.metropolisparking.routes

import akka.http.scaladsl.model.StatusCodes
import akka.http.scaladsl.server.Route
import com.metropolisparking.{BaseRoutesSpec, TestFixtures}
import com.metropolisparking.services.RevenueAnalyticsService
import org.scalatest.funspec.AnyFunSpec
import org.scalatest.matchers.should.Matchers

class AnalyticsRoutesSpec extends BaseRoutesSpec {

  val analyticsService = new RevenueAnalyticsService(dslContext)
  val analyticsRoutes: Route = seal(new AnalyticsRoutes(analyticsService, rbacMiddleware).routes)

  describe("AnalyticsRoutes") {
    it("returns 403 Forbidden for CUSTOMER role requesting analytics") {
      val customer = TestFixtures.aUser(dslContext, "CUSTOMER")
      val customerHeader = authHeader(customer.id.toString, "CUSTOMER")

      Get("/analytics/revenue").withHeaders(customerHeader) ~> analyticsRoutes ~> check {
        status shouldBe StatusCodes.Forbidden
      }
    }

    it("returns 200 OK for ADMIN role requesting analytics revenue summary") {
      val admin = TestFixtures.aUser(dslContext, "ADMIN")
      val adminHeader = authHeader(admin.id.toString, "ADMIN")

      Get("/analytics/revenue").withHeaders(adminHeader) ~> analyticsRoutes ~> check {
        status shouldBe StatusCodes.OK
      }
    }

    it("accepts optional lotId query parameter") {
      val admin = TestFixtures.aUser(dslContext, "ADMIN")
      val adminHeader = authHeader(admin.id.toString, "ADMIN")
      val lot = TestFixtures.aLot(dslContext)

      Get(s"/analytics/revenue?lotId=${lot.id}").withHeaders(adminHeader) ~> analyticsRoutes ~> check {
        status shouldBe StatusCodes.OK
      }
    }
  }
}
