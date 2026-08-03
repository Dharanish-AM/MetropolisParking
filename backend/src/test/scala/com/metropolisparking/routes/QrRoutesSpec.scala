package com.metropolisparking.routes

import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import akka.http.scaladsl.model.{ContentTypes, HttpEntity, StatusCodes}
import akka.http.scaladsl.server.Route
import com.metropolisparking.{BaseRoutesSpec, TestFixtures}
import org.scalatest.funspec.AnyFunSpec
import org.scalatest.matchers.should.Matchers
import java.util.UUID

class QrRoutesSpec extends BaseRoutesSpec {

  val qrRoutes: Route = seal(new QrRoutes(qrService, rbacMiddleware).routes)
  private def jsonBody(s: String) = HttpEntity(ContentTypes.`application/json`, s)

  describe("QrRoutes") {
    it("returns 401 for unauthenticated request to GET /qr/generate") {
      Get(s"/qr/generate?entityType=SESSION&entityId=${UUID.randomUUID()}") ~> qrRoutes ~> check {
        status shouldBe StatusCodes.Unauthorized
      }
    }

    it("generates QR token for authenticated request") {
      val lot = TestFixtures.aLot(dslContext)
      val level = TestFixtures.aLevel(dslContext, lot.id)
      val space = TestFixtures.aSpace(dslContext, lot.id, level.id)
      val session = TestFixtures.aSession(dslContext, space.id)
      val user = TestFixtures.aUser(dslContext, "CUSTOMER")

      val header = authHeader(user.id.toString, "CUSTOMER")
      Get(s"/qr/generate?entityType=SESSION&entityId=${session.id}").withHeaders(header) ~> qrRoutes ~> check {
        status shouldBe StatusCodes.OK
      }
    }

    it("scans QR token via POST /qr/scan") {
      val lot = TestFixtures.aLot(dslContext)
      val level = TestFixtures.aLevel(dslContext, lot.id)
      val space = TestFixtures.aSpace(dslContext, lot.id, level.id)
      val session = TestFixtures.aSession(dslContext, space.id)
      val pass = qrService.generatePass("SESSION", session.id)

      val user = TestFixtures.aUser(dslContext, "CUSTOMER")
      val header = authHeader(user.id.toString, "CUSTOMER")
      val body = jsonBody(s"""{"qrToken":"${pass.qrToken}"}""")

      Post("/qr/scan", body).withHeaders(header) ~> qrRoutes ~> check {
        status shouldBe StatusCodes.OK
      }
    }
  }
}
