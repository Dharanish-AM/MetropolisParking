package com.metropolisparking.routes

import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import akka.http.scaladsl.model.{ContentTypes, HttpEntity, StatusCodes}
import akka.http.scaladsl.server.Route
import com.metropolisparking.{BaseRoutesSpec, TestFixtures}
import org.scalatest.funspec.AnyFunSpec
import org.scalatest.matchers.should.Matchers

class VehicleRoutesSpec extends BaseRoutesSpec {

  val vehicleRoutes: Route = seal(new VehicleRoutes(vehicleService, rbacMiddleware).routes)
  private def jsonBody(s: String) = HttpEntity(ContentTypes.`application/json`, s)

  describe("VehicleRoutes") {
    it("allows public GET /vehicles") {
      Get("/vehicles") ~> vehicleRoutes ~> check {
        status shouldBe StatusCodes.OK
      }
    }

    it("registers a vehicle for authenticated user via POST /vehicles") {
      val user = TestFixtures.aUser(dslContext, "CUSTOMER")
      val header = authHeader(user.id.toString, "CUSTOMER")
      val body = jsonBody("""{"plateNumber":"MH12AB1234","type":"CAR"}""")

      Post("/vehicles", body).withHeaders(header) ~> vehicleRoutes ~> check {
        status shouldBe StatusCodes.OK
      }
    }

    it("returns 409 for duplicate vehicle plate number") {
      val user = TestFixtures.aUser(dslContext, "CUSTOMER")
      val header = authHeader(user.id.toString, "CUSTOMER")
      val body = jsonBody("""{"plateNumber":"MH12AB1234","type":"CAR"}""")

      Post("/vehicles", body).withHeaders(header) ~> vehicleRoutes ~> check { status shouldBe StatusCodes.OK }
      Post("/vehicles", body).withHeaders(header) ~> vehicleRoutes ~> check { status shouldBe StatusCodes.Conflict }
    }
  }
}
