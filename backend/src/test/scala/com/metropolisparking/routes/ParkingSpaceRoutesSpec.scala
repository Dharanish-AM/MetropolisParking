package com.metropolisparking.routes

import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import akka.http.scaladsl.model.{ContentTypes, HttpEntity, StatusCodes}
import akka.http.scaladsl.server.Route
import com.metropolisparking.{BaseRoutesSpec, TestFixtures}
import org.scalatest.funspec.AnyFunSpec
import org.scalatest.matchers.should.Matchers
import java.util.UUID

class ParkingSpaceRoutesSpec extends BaseRoutesSpec {

  val spaceRoutes: Route = seal(new ParkingSpaceRoutes(lotService, rbacMiddleware).routes)
  private def jsonBody(s: String) = HttpEntity(ContentTypes.`application/json`, s)

  describe("ParkingSpaceRoutes") {
    it("returns public GET /spaces list") {
      Get("/spaces") ~> spaceRoutes ~> check {
        status shouldBe StatusCodes.OK
      }
    }

    it("returns 403 when CUSTOMER posts to /spaces") {
      val user = TestFixtures.aUser(dslContext, "CUSTOMER")
      val header = authHeader(user.id.toString, "CUSTOMER")
      val body = jsonBody("""{"lotId":"00000000-0000-0000-0000-000000000000","levelId":"00000000-0000-0000-0000-000000000000","spaceNumber":"S-10","type":"CAR"}""")

      Post("/spaces", body).withHeaders(header) ~> spaceRoutes ~> check {
        status shouldBe StatusCodes.Forbidden
      }
    }

    it("allows ADMIN to POST /spaces") {
      val lot = TestFixtures.aLot(dslContext)
      val level = TestFixtures.aLevel(dslContext, lot.id)
      val admin = TestFixtures.aUser(dslContext, "ADMIN")
      val header = authHeader(admin.id.toString, "ADMIN")
      val body = jsonBody(s"""{"lotId":"${lot.id}","levelId":"${level.id}","spaceNumber":"S-10","type":"CAR"}""")

      Post("/spaces", body).withHeaders(header) ~> spaceRoutes ~> check {
        status shouldBe StatusCodes.OK
      }
    }
  }
}
