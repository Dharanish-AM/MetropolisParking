package com.metropolisparking.validation

import com.metropolisparking.exceptions.ValidationException
import org.scalatest.funspec.AnyFunSpec
import org.scalatest.matchers.should.Matchers

class ValidatorSpec extends AnyFunSpec with Matchers {
  describe("Validator") {
    it("should validate valid email addresses") {
      noException should be thrownBy Validator.validateEmail("test@example.com")
      noException should be thrownBy Validator.validateEmail("admin.user+1@metropolisparking.co")
    }

    it("should reject invalid email addresses") {
      intercept[ValidationException] {
        Validator.validateEmail("invalid-email")
      }
      intercept[ValidationException] {
        Validator.validateEmail("")
      }
    }

    it("should validate valid license plates") {
      noException should be thrownBy Validator.validatePlateNumber("MH12AB1234")
      noException should be thrownBy Validator.validatePlateNumber("KA-01-MX-9999")
    }

    it("should reject invalid license plates") {
      intercept[ValidationException] {
        Validator.validatePlateNumber("AB")
      }
      intercept[ValidationException] {
        Validator.validatePlateNumber("1234567890123456")
      }
    }
  }
}
