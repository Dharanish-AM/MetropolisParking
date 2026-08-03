package com.metropolisparking.routes

import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import akka.http.scaladsl.model.{ContentTypes, HttpEntity, StatusCodes}
import akka.http.scaladsl.server.Route
import com.metropolisparking.{BaseRoutesSpec, TestFixtures}
import org.scalatest.funspec.AnyFunSpec
import org.scalatest.matchers.should.Matchers
import java.util.UUID

class ParkingLotRoutesSpec extends BaseRoutesSpec {

  val lotRoutes: Route = seal(new ParkingLotRoutes(lotService, rbacMiddleware).routes)
  private def jsonBody(s: String) = HttpEntity(ContentTypes.`application/json`, s)

  describe("ParkingLotRoutes") {
    it("allows public GET /parking-lots without auth") {
      Get("/parking-lots") ~> lotRoutes ~> check {
        status shouldBe StatusCodes.OK
      }
    }

    it("returns 403 for CUSTOMER attempting POST /parking-lots") {
      val user = TestFixtures.aUser(dslContext, "CUSTOMER")
      val header = authHeader(user.id.toString, "CUSTOMER")
      val body = jsonBody("""{"name":"New Lot","location":"Downtown"}""")

      Post("/parking-lots", body).withHeaders(header) ~> lotRoutes ~> check {
        status shouldBe StatusCodes.Forbidden
      }
    }

    it("allows ADMIN to POST /parking-lots and create a new lot") {
      val admin = TestFixtures.aUser(dslContext, "ADMIN")
      val header = authHeader(admin.id.toString, "ADMIN")
      val body = jsonBody("""{"name":"Admin Lot","location":"Uptown"}""")

      Post("/parking-lots", body).withHeaders(header) ~> lotRoutes ~> check {
        status shouldBe StatusCodes.OK
      }
    }

    it("returns 404 for GET /parking-lots/:id when lot does not exist") {
      Get(s"/parking-lots/${UUID.randomUUID()}") ~> lotRoutes ~> check {
        status shouldBe StatusCodes.NotFound
      }
    }
  }
}
