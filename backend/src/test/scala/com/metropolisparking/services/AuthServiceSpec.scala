package com.metropolisparking.services

import com.metropolisparking.TestDbSpec
import com.metropolisparking.dto.{LoginRequest, UserRegistrationRequest}
import com.metropolisparking.exceptions.{AuthenticationException, ConflictException}
import com.metropolisparking.repositories.UserRepository
import com.metropolisparking.repositories.AuditLogRepository
import com.metropolisparking.security.SecurityModule
import org.scalatest.funspec.AnyFunSpec
import org.scalatest.matchers.should.Matchers
import java.util.UUID

class AuthServiceSpec extends AnyFunSpec with Matchers with TestDbSpec {
  val userRepo = new UserRepository(dslContext)
  val auditLogRepo = new AuditLogRepository(dslContext)
  val auditLogService = new AuditLogService(auditLogRepo)
  val securityModule = new SecurityModule("test-secret-key-that-is-long-enough-for-jwt-signing")
  val authService = new AuthService(userRepo, securityModule, auditLogService)

  describe("AuthService") {
    it("should register a new user and log them in successfully") {
      val email = s"user-${UUID.randomUUID()}@metropolisparking.com"
      val regReq = UserRegistrationRequest("Test User", email, Some("secret123"), "CUSTOMER")

      val regResp = authService.register(regReq)
      regResp.email shouldBe email
      regResp.role shouldBe "CUSTOMER"

      val loginReq = LoginRequest(email, "secret123")
      val loginResp = authService.login(loginReq)

      loginResp.token should not be empty
      loginResp.user.email shouldBe email
      loginResp.user.role shouldBe "CUSTOMER"
    }

    it("should reject login with wrong password") {
      val email = s"user-${UUID.randomUUID()}@metropolisparking.com"
      val regReq = UserRegistrationRequest("Test User", email, Some("secret123"), "CUSTOMER")
      authService.register(regReq)

      val loginReq = LoginRequest(email, "wrong-password")
      intercept[AuthenticationException] {
        authService.login(loginReq)
      }
    }

    it("should prevent duplicate registrations") {
      val email = s"user-${UUID.randomUUID()}@metropolisparking.com"
      val regReq = UserRegistrationRequest("Test User", email, Some("secret123"), "CUSTOMER")
      authService.register(regReq)

      intercept[ConflictException] {
        authService.register(regReq)
      }
    }
  }
}
