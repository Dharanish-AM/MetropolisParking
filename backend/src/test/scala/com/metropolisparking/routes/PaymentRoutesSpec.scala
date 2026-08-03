package com.metropolisparking.routes

import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import akka.http.scaladsl.model.{ContentTypes, HttpEntity, StatusCodes}
import akka.http.scaladsl.server.Route
import com.metropolisparking.{BaseRoutesSpec, TestFixtures}
import com.metropolisparking.models.Payment
import org.scalatest.funspec.AnyFunSpec
import org.scalatest.matchers.should.Matchers
import java.util.UUID

class PaymentRoutesSpec extends BaseRoutesSpec {

  val payRoutes: Route = seal(new PaymentRoutes(paymentService, rbacMiddleware).routes)
  private def jsonBody(s: String) = HttpEntity(ContentTypes.`application/json`, s)

  describe("PaymentRoutes") {
    it("returns 403 for CUSTOMER attempting to list payments") {
      val user = TestFixtures.aUser(dslContext, "CUSTOMER")
      val header = authHeader(user.id.toString, "CUSTOMER")

      Get("/payments").withHeaders(header) ~> payRoutes ~> check {
        status shouldBe StatusCodes.Forbidden
      }
    }

    it("returns 200 for ADMIN listing payments") {
      val admin = TestFixtures.aUser(dslContext, "ADMIN")
      val header = authHeader(admin.id.toString, "ADMIN")

      Get("/payments").withHeaders(header) ~> payRoutes ~> check {
        status shouldBe StatusCodes.OK
      }
    }

    it("settles a pending payment via POST /payments/:id") {
      val lot = TestFixtures.aLot(dslContext)
      val level = TestFixtures.aLevel(dslContext, lot.id)
      val space = TestFixtures.aSpace(dslContext, lot.id, level.id)
      val session = TestFixtures.aSession(dslContext, space.id)
      val payment = paymentRepo.create(Payment(UUID.randomUUID(), session.id, BigDecimal("12.00"), "CASH", "PENDING"))

      val user = TestFixtures.aUser(dslContext, "CUSTOMER")
      val header = authHeader(user.id.toString, "CUSTOMER")
      val body = jsonBody("""{"method":"CARD"}""")

      Post(s"/payments/${payment.id}", body).withHeaders(header) ~> payRoutes ~> check {
        status shouldBe StatusCodes.OK
      }
    }

    it("returns 404 when processing non-existent payment ID") {
      val user = TestFixtures.aUser(dslContext, "CUSTOMER")
      val header = authHeader(user.id.toString, "CUSTOMER")
      val body = jsonBody("""{"method":"CARD"}""")

      Post(s"/payments/${UUID.randomUUID()}", body).withHeaders(header) ~> payRoutes ~> check {
        status shouldBe StatusCodes.NotFound
      }
    }
  }
}
