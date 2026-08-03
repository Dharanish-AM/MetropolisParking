package com.metropolisparking.routes

import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import akka.http.scaladsl.model.{ContentTypes, HttpEntity, StatusCodes}
import akka.http.scaladsl.server.Route
import com.metropolisparking.{BaseRoutesSpec, TestFixtures}
import org.scalatest.funspec.AnyFunSpec
import org.scalatest.matchers.should.Matchers
import spray.json._
import java.util.UUID

class ParkingSessionRoutesSpec extends BaseRoutesSpec {

  val sessionRoutes: Route = seal(new ParkingSessionRoutes(sessionService, rbacMiddleware).routes)
  private def jsonBody(s: String) = HttpEntity(ContentTypes.`application/json`, s)

  describe("ParkingSessionRoutes") {
    it("returns 401 when starting a session without auth header") {
      Post("/sessions/start", jsonBody("""{"plateNumber":"MH12AB1234","spaceId":"00000000-0000-0000-0000-000000000000"}""")) ~>
        sessionRoutes ~> check {
          status shouldBe StatusCodes.Unauthorized
        }
    }

    it("starts a session successfully with valid token") {
      val lot = TestFixtures.aLot(dslContext)
      val level = TestFixtures.aLevel(dslContext, lot.id)
      val space = TestFixtures.aSpace(dslContext, lot.id, level.id)
      val user = TestFixtures.aUser(dslContext, "CUSTOMER")

      val header = authHeader(user.id.toString, "CUSTOMER")
      val body = jsonBody(s"""{"plateNumber":"MH12AB1234","spaceId":"${space.id}"}""")

      Post("/sessions/start", body).withHeaders(header) ~> sessionRoutes ~> check {
        status shouldBe StatusCodes.OK
      }
    }

    it("returns 409 when starting a session on an OCCUPIED space") {
      val lot = TestFixtures.aLot(dslContext)
      val level = TestFixtures.aLevel(dslContext, lot.id)
      val space = TestFixtures.aSpace(dslContext, lot.id, level.id, status = "OCCUPIED")
      val user = TestFixtures.aUser(dslContext, "CUSTOMER")

      val header = authHeader(user.id.toString, "CUSTOMER")
      val body = jsonBody(s"""{"plateNumber":"MH12AB1234","spaceId":"${space.id}"}""")

      Post("/sessions/start", body).withHeaders(header) ~> sessionRoutes ~> check {
        status shouldBe StatusCodes.Conflict
      }
    }

    it("returns 404 when ending session for an unknown plate") {
      val user = TestFixtures.aUser(dslContext, "CUSTOMER")
      val header = authHeader(user.id.toString, "CUSTOMER")
      val body = jsonBody("""{"plateNumber":"UNKNOWN9999"}""")

      Post("/sessions/end", body).withHeaders(header) ~> sessionRoutes ~> check {
        status shouldBe StatusCodes.NotFound
      }
    }

    it("GET /sessions?active=true returns list of sessions") {
      Get("/sessions?active=true") ~> sessionRoutes ~> check {
        status shouldBe StatusCodes.OK
      }
    }
  }
}
