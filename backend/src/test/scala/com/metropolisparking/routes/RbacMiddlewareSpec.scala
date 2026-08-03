package com.metropolisparking.routes

import akka.http.scaladsl.model.StatusCodes
import akka.http.scaladsl.model.headers.RawHeader
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route
import com.metropolisparking.BaseRoutesSpec
import org.scalatest.funspec.AnyFunSpec
import org.scalatest.matchers.should.Matchers
import java.util.UUID

class RbacMiddlewareSpec extends BaseRoutesSpec {

  val testAdminRoute: Route = seal(
    path("admin-only") {
      rbacMiddleware.authorizeRoles(Set("ADMIN")) { claims =>
        complete("OK")
      }
    }
  )

  describe("RbacMiddleware") {
    it("rejects request missing Authorization header") {
      Get("/admin-only") ~> testAdminRoute ~> check {
        status shouldBe StatusCodes.Unauthorized
      }
    }

    it("rejects malformed Authorization header with 401") {
      Get("/admin-only").withHeaders(RawHeader("Authorization", "MalformedTokenHeader")) ~> testAdminRoute ~> check {
        status shouldBe StatusCodes.Unauthorized
      }
    }

    it("returns 403 when user has wrong role") {
      val header = authHeader(UUID.randomUUID().toString, "CUSTOMER")
      Get("/admin-only").withHeaders(header) ~> testAdminRoute ~> check {
        status shouldBe StatusCodes.Forbidden
      }
    }

    it("passes inner route when valid token matches required role") {
      val header = authHeader(UUID.randomUUID().toString, "ADMIN")
      Get("/admin-only").withHeaders(header) ~> testAdminRoute ~> check {
        status shouldBe StatusCodes.OK
        responseAs[String] shouldBe "OK"
      }
    }

    it("returns 401 when token is expired") {
      val expiredToken = securityModule.generateToken(UUID.randomUUID().toString, "ADMIN", expireDurationSeconds = -10)
      Get("/admin-only").withHeaders(RawHeader("Authorization", s"Bearer $expiredToken")) ~> testAdminRoute ~> check {
        status shouldBe StatusCodes.Unauthorized
      }
    }
  }
}
