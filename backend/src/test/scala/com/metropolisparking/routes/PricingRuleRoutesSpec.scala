package com.metropolisparking.routes

import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import akka.http.scaladsl.model.{ContentTypes, HttpEntity, StatusCodes}
import akka.http.scaladsl.server.Route
import com.metropolisparking.{BaseRoutesSpec, TestFixtures}
import com.metropolisparking.services.PricingRuleService
import org.scalatest.funspec.AnyFunSpec
import org.scalatest.matchers.should.Matchers

class PricingRuleRoutesSpec extends BaseRoutesSpec {

  val pricingService = new PricingRuleService(pricingRuleRepo, auditLogService)
  val pricingRoutes: Route = seal(new PricingRuleRoutes(pricingService, rbacMiddleware).routes)

  private def jsonBody(s: String) = HttpEntity(ContentTypes.`application/json`, s)

  describe("PricingRuleRoutes") {
    it("allows listing pricing rules without authentication") {
      Get("/pricing-rules") ~> pricingRoutes ~> check {
        status shouldBe StatusCodes.OK
      }
    }

    it("requires ADMIN/OPERATOR role to create pricing rule") {
      val customer = TestFixtures.aUser(dslContext, "CUSTOMER")
      val customerHeader = authHeader(customer.id.toString, "CUSTOMER")
      val body = jsonBody("""{"ruleType":"HOURLY","rate":10.00}""")

      Post("/pricing-rules", body).withHeaders(customerHeader) ~> pricingRoutes ~> check {
        status shouldBe StatusCodes.Forbidden
      }
    }

    it("allows ADMIN to create pricing rule") {
      val admin = TestFixtures.aUser(dslContext, "ADMIN")
      val adminHeader = authHeader(admin.id.toString, "ADMIN")
      val body = jsonBody("""{"ruleType":"FLAT","rate":15.00}""")

      Post("/pricing-rules", body).withHeaders(adminHeader) ~> pricingRoutes ~> check {
        status shouldBe StatusCodes.OK
      }
    }

    it("calculates fee preview via POST /pricing-rules/calculate-preview") {
      val lot = TestFixtures.aLot(dslContext)
      val body = jsonBody(s"""{"lotId":"${lot.id}","vehicleType":"CAR","entryTime":"2026-08-13T10:00:00Z","exitTime":"2026-08-13T12:00:00Z"}""")

      Post("/pricing-rules/calculate-preview", body) ~> pricingRoutes ~> check {
        status shouldBe StatusCodes.OK
      }
    }
  }
}
