package com.metropolisparking.exceptions

sealed abstract class MetropolisException(val code: String, val message: String) extends RuntimeException(message)

case class ValidationException(msg: String) extends MetropolisException("VALIDATION_ERROR", msg)
case class AuthenticationException(msg: String) extends MetropolisException("AUTHENTICATION_FAILED", msg)
case class AuthorizationException(msg: String) extends MetropolisException("AUTHORIZATION_FAILED", msg)
case class NotFoundException(msg: String) extends MetropolisException("RESOURCE_NOT_FOUND", msg)
case class ConflictException(msg: String) extends MetropolisException("RESOURCE_CONFLICT", msg)
case class BusinessRuleException(override val code: String, override val message: String) extends MetropolisException(code, message)
