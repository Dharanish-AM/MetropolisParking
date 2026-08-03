package com.metropolisparking.routes

import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import akka.http.scaladsl.model.{ContentTypes, HttpEntity, StatusCodes}
import akka.http.scaladsl.server.Route
import com.metropolisparking.{BaseRoutesSpec, TestFixtures}
import org.scalatest.funspec.AnyFunSpec
import org.scalatest.matchers.should.Matchers
import java.time.Instant
import java.util.UUID

class ReservationRoutesSpec extends BaseRoutesSpec {

  val resRoutes: Route = seal(new ReservationRoutes(reservationService, rbacMiddleware).routes)
  private def jsonBody(s: String) = HttpEntity(ContentTypes.`application/json`, s)

  describe("ReservationRoutes") {
    it("returns 401 when requesting POST /reservations without auth") {
      Post("/reservations", jsonBody("""{"spaceId":"00000000-0000-0000-0000-000000000000","startTime":"2026-08-03T12:00:00Z","endTime":"2026-08-03T13:00:00Z","vehicleType":"CAR"}""")) ~>
        resRoutes ~> check {
          status shouldBe StatusCodes.Unauthorized
        }
    }

    it("creates reservation successfully for authenticated user") {
      val lot = TestFixtures.aLot(dslContext)
      val level = TestFixtures.aLevel(dslContext, lot.id)
      val space = TestFixtures.aSpace(dslContext, lot.id, level.id)
      val user = TestFixtures.aUser(dslContext, "CUSTOMER")

      val header = authHeader(user.id.toString, "CUSTOMER")
      val start = Instant.now().plusSeconds(300).toString
      val end = Instant.now().plusSeconds(3900).toString
      val body = jsonBody(s"""{"spaceId":"${space.id}","startTime":"$start","endTime":"$end","vehicleType":"CAR"}""")

      Post("/reservations", body).withHeaders(header) ~> resRoutes ~> check {
        status shouldBe StatusCodes.OK
      }
    }

    it("returns 409 when POSTing an overlapping reservation window") {
      val lot = TestFixtures.aLot(dslContext)
      val level = TestFixtures.aLevel(dslContext, lot.id)
      val space = TestFixtures.aSpace(dslContext, lot.id, level.id)
      val user = TestFixtures.aUser(dslContext, "CUSTOMER")

      val start = Instant.now().plusSeconds(300)
      val end = Instant.now().plusSeconds(3900)
      TestFixtures.aReservation(dslContext, space.id, Some(user.id), start, end)

      val header = authHeader(user.id.toString, "CUSTOMER")
      val body = jsonBody(s"""{"spaceId":"${space.id}","startTime":"$start","endTime":"$end","vehicleType":"CAR"}""")

      Post("/reservations", body).withHeaders(header) ~> resRoutes ~> check {
        status shouldBe StatusCodes.Conflict
      }
    }

    it("returns 404 when DELETEing non-existent reservation ID") {
      val user = TestFixtures.aUser(dslContext, "CUSTOMER")
      val header = authHeader(user.id.toString, "CUSTOMER")

      Delete(s"/reservations/${UUID.randomUUID()}").withHeaders(header) ~> resRoutes ~> check {
        status shouldBe StatusCodes.NotFound
      }
    }
  }
}
