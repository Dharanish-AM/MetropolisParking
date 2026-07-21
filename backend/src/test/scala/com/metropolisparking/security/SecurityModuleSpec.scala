package com.metropolisparking.security

import org.scalatest.funspec.AnyFunSpec
import org.scalatest.matchers.should.Matchers

class SecurityModuleSpec extends AnyFunSpec with Matchers {
  val security = new SecurityModule("test-secret-key-that-is-long-enough-for-jwt-signing")

  describe("SecurityModule") {
    it("should hash and verify passwords correctly") {
      val rawPassword = "securePassword123"
      val hash = security.hashPassword(rawPassword)

      hash should not equal rawPassword
      security.checkPassword(rawPassword, hash) shouldBe true
      security.checkPassword("wrongPassword", hash) shouldBe false
    }

    it("should generate and verify JWT tokens correctly") {
      val userId = "user-123-uuid"
      val role = "ADMIN"
      val token = security.generateToken(userId, role, expireDurationSeconds = 3600)

      val claimsTry = security.verifyToken(token)
      claimsTry.isSuccess shouldBe true

      val claims = claimsTry.get
      claims.userId shouldBe userId
      claims.role shouldBe role
    }

    it("should fail verification for expired or modified tokens") {
      val token = security.generateToken("user", "CUSTOMER", expireDurationSeconds = -10)
      security.verifyToken(token).isFailure shouldBe true

      val modifiedToken = token + "modified"
      security.verifyToken(modifiedToken).isFailure shouldBe true
    }
  }
}
