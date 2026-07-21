package com.metropolisparking.validation

import com.metropolisparking.exceptions.ValidationException
import java.util.regex.Pattern

object Validator {
  private val EmailRegex = Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$")
  private val PlateRegex = Pattern.compile("^[A-Z0-9-]{4,15}$")

  def validateEmail(email: String, fieldName: String = "email"): Unit = {
    if (email == null || email.trim.isEmpty) {
      throw ValidationException(s"Field '$fieldName' is required")
    }
    if (!EmailRegex.matcher(email).matches()) {
      throw ValidationException(s"Field '$fieldName' is invalid: $email")
    }
  }

  def validateRequired(value: String, fieldName: String): Unit = {
    if (value == null || value.trim.isEmpty) {
      throw ValidationException(s"Field '$fieldName' is required")
    }
  }

  def validateLength(value: String, min: Int, max: Int, fieldName: String): Unit = {
    validateRequired(value, fieldName)
    if (value.length < min || value.length > max) {
      throw ValidationException(s"Field '$fieldName' must be between $min and $max characters")
    }
  }

  def validatePlateNumber(plateNumber: String, fieldName: String = "plateNumber"): Unit = {
    validateRequired(plateNumber, fieldName)
    val upper = plateNumber.toUpperCase.replace(" ", "")
    if (!PlateRegex.matcher(upper).matches()) {
      throw ValidationException(s"Field '$fieldName' is invalid: $plateNumber")
    }
  }

  def validateRange(value: Int, min: Int, max: Int, fieldName: String): Unit = {
    if (value < min || value > max) {
      throw ValidationException(s"Field '$fieldName' must be between $min and $max")
    }
  }

  def validateRange(value: Double, min: Double, max: Double, fieldName: String): Unit = {
    if (value < min || value > max) {
      throw ValidationException(s"Field '$fieldName' must be between $min and $max")
    }
  }

  def validateEnum(value: String, validValues: Set[String], fieldName: String): Unit = {
    validateRequired(value, fieldName)
    if (!validValues.contains(value)) {
      throw ValidationException(s"Field '$fieldName' must be one of: ${validValues.mkString(", ")}")
    }
  }
}
