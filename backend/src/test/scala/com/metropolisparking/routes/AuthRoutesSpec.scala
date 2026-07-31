package com.metropolisparking.routes

import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import akka.http.scaladsl.model.{ContentTypes, HttpEntity, StatusCodes}
import akka.http.scaladsl.model.headers.RawHeader
import akka.http.scaladsl.server.{ExceptionHandler, RejectionHandler, Route}
import akka.http.scaladsl.testkit.ScalatestRouteTest
import com.metropolisparking.TestDbSpec
import com.metropolisparking.exceptions.GlobalErrorHandler
import com.metropolisparking.middleware.RbacMiddleware
import com.metropolisparking.repositories.{AuditLogRepository, UserRepository}
import com.metropolisparking.security.SecurityModule
import com.metropolisparking.services.{AuditLogService, AuthService}
import org.scalatest.funspec.AnyFunSpec
import org.scalatest.matchers.should.Matchers
import spray.json._
import java.util.UUID

class AuthRoutesSpec extends AnyFunSpec with Matchers with ScalatestRouteTest with TestDbSpec {

  val userRepo        = new UserRepository(dslContext)
  val auditLogRepo    = new AuditLogRepository(dslContext)
  val auditLogService = new AuditLogService(auditLogRepo)
  val security        = new SecurityModule("test-secret-key-that-is-long-enough-for-jwt-signing")
  val authService     = new AuthService(userRepo, security, auditLogService)
  val rbac            = new RbacMiddleware(security)

  // Bring exception/rejection handlers into implicit scope so Route.seal picks them up
  implicit val exHandler: ExceptionHandler  = GlobalErrorHandler.exceptionHandler
  implicit val rejHandler: RejectionHandler = GlobalErrorHandler.rejectionHandler

  val routes: Route = Route.seal(new AuthRoutes(authService, rbac).routes)

  private def jsonBody(s: String) = HttpEntity(ContentTypes.`application/json`, s)

  describe("POST /auth/register") {
    it("returns 200 with the new user's details") {
      val email = s"reg-route-${UUID.randomUUID()}@example.com"
      Post("/auth/register", jsonBody(
        s"""{"name":"Route Tester","email":"$email","password":"pass123","role":"CUSTOMER"}"""
      )) ~> routes ~> check {
        status shouldBe StatusCodes.OK
        val body = responseAs[JsValue].asJsObject
        body.fields("email") shouldBe JsString(email)
        body.fields("role")  shouldBe JsString("CUSTOMER")
      }
    }

    it("returns 409 for a duplicate email") {
      val email   = s"dup-route-${UUID.randomUUID()}@example.com"
      val payload = jsonBody(
        s"""{"name":"Dup User","email":"$email","password":"pass123","role":"CUSTOMER"}"""
      )
      Post("/auth/register", payload) ~> routes ~> check { status shouldBe StatusCodes.OK }
      Post("/auth/register", payload) ~> routes ~> check { status shouldBe StatusCodes.Conflict }
    }
  }

  describe("POST /auth/login") {
    it("returns 200 with a JWT token for valid credentials") {
      val email = s"login-route-${UUID.randomUUID()}@example.com"
      Post("/auth/register", jsonBody(
        s"""{"name":"Login User","email":"$email","password":"secret123","role":"CUSTOMER"}"""
      )) ~> routes ~> check { status shouldBe StatusCodes.OK }

      Post("/auth/login", jsonBody(
        s"""{"email":"$email","password":"secret123"}"""
      )) ~> routes ~> check {
        status shouldBe StatusCodes.OK
        val body = responseAs[JsValue].asJsObject
        body.fields.keys should contain("token")
        body.fields("token").asInstanceOf[JsString].value should not be empty
      }
    }

    it("returns 401 for wrong password") {
      val email = s"bad-login-${UUID.randomUUID()}@example.com"
      Post("/auth/register", jsonBody(
        s"""{"name":"Bad User","email":"$email","password":"correct","role":"CUSTOMER"}"""
      )) ~> routes ~> check { status shouldBe StatusCodes.OK }

      Post("/auth/login", jsonBody(
        s"""{"email":"$email","password":"wrong"}"""
      )) ~> routes ~> check { status shouldBe StatusCodes.Unauthorized }
    }
  }

  describe("GET /me") {
    it("returns the user profile for a valid Bearer token") {
      val email  = s"me-route-${UUID.randomUUID()}@example.com"
      var userId = ""

      Post("/auth/register", jsonBody(
        s"""{"name":"Me User","email":"$email","password":"pass123","role":"CUSTOMER"}"""
      )) ~> routes ~> check {
        status shouldBe StatusCodes.OK
        userId = responseAs[JsValue].asJsObject.fields("id").asInstanceOf[JsString].value
      }

      val token = security.generateToken(userId, "CUSTOMER", expireDurationSeconds = 3600)
      Get("/me").withHeaders(RawHeader("Authorization", s"Bearer $token")) ~> routes ~> check {
        status shouldBe StatusCodes.OK
        val body = responseAs[JsValue].asJsObject
        body.fields("email") shouldBe JsString(email)
        body.fields("role")  shouldBe JsString("CUSTOMER")
      }
    }

    it("returns 401 when no Authorization header is present") {
      Get("/me") ~> routes ~> check {
        status shouldBe StatusCodes.Unauthorized
      }
    }

    it("returns 401 for a tampered token") {
      Get("/me").withHeaders(RawHeader("Authorization", "Bearer tampered.token.value")) ~>
        routes ~> check {
          status shouldBe StatusCodes.Unauthorized
        }
    }
  }

  describe("POST /auth/logout") {
    it("returns 200 with a confirmation message") {
      Post("/auth/logout") ~> routes ~> check {
        status shouldBe StatusCodes.OK
        val body = responseAs[JsValue].asJsObject
        body.fields("message").asInstanceOf[JsString].value should include("Logged out")
      }
    }
  }
}
