package com.metropolisparking.routes

import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import akka.http.scaladsl.model.{ContentTypes, HttpEntity, StatusCodes}
import akka.http.scaladsl.server.Route
import com.metropolisparking.{BaseRoutesSpec, TestFixtures}
import org.scalatest.funspec.AnyFunSpec
import org.scalatest.matchers.should.Matchers

class AnprRoutesSpec extends BaseRoutesSpec {

  val anprRoutes: Route = seal(new AnprRoutes(anprService, rbacMiddleware).routes)
  private def jsonBody(s: String) = HttpEntity(ContentTypes.`application/json`, s)

  describe("AnprRoutes") {
    it("returns 403 when CUSTOMER calls POST /anpr/entry") {
      val lot = TestFixtures.aLot(dslContext)
      val user = TestFixtures.aUser(dslContext, "CUSTOMER")
      val header = authHeader(user.id.toString, "CUSTOMER")
      val body = jsonBody(s"""{"lotId":"${lot.id}","plateNumber":"MH12AB1234"}""")

      Post("/anpr/entry", body).withHeaders(header) ~> anprRoutes ~> check {
        status shouldBe StatusCodes.Forbidden
      }
    }

    it("allows ADMIN to POST /anpr/entry and returns entry details") {
      val lot = TestFixtures.aLot(dslContext)
      val level = TestFixtures.aLevel(dslContext, lot.id)
      TestFixtures.aSpace(dslContext, lot.id, level.id)

      val admin = TestFixtures.aUser(dslContext, "ADMIN")
      val header = authHeader(admin.id.toString, "ADMIN")
      val body = jsonBody(s"""{"lotId":"${lot.id}","plateNumber":"MH12AB1234"}""")

      Post("/anpr/entry", body).withHeaders(header) ~> anprRoutes ~> check {
        status shouldBe StatusCodes.OK
      }
    }

    it("allows ADMIN to POST /anpr/exit") {
      val lot = TestFixtures.aLot(dslContext)
      val level = TestFixtures.aLevel(dslContext, lot.id)
      TestFixtures.aSpace(dslContext, lot.id, level.id)
      anprService.simulateEntry(com.metropolisparking.dto.AnprEntryRequest("MH12AB1234", lot.id))

      val admin = TestFixtures.aUser(dslContext, "ADMIN")
      val header = authHeader(admin.id.toString, "ADMIN")
      val body = jsonBody("""{"plateNumber":"MH12AB1234"}""")

      Post("/anpr/exit", body).withHeaders(header) ~> anprRoutes ~> check {
        status shouldBe StatusCodes.OK
      }
    }
  }
}
