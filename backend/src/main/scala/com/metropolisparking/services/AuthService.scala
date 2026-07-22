package com.metropolisparking.services

import com.metropolisparking.dto.{LoginRequest, LoginResponse, UserRegistrationRequest, UserResponse}
import com.metropolisparking.exceptions.{AuthenticationException, ConflictException, NotFoundException}
import com.metropolisparking.models.User
import com.metropolisparking.repositories.UserRepository
import com.metropolisparking.security.SecurityModule
import com.metropolisparking.validation.Validator
import java.util.UUID

class AuthService(
  repo: UserRepository,
  securityModule: SecurityModule,
  auditLogService: AuditLogService
) {
  def login(req: LoginRequest): LoginResponse = {
    Validator.validateEmail(req.email)
    Validator.validateRequired(req.password, "password")

    repo.findByEmail(req.email) match {
      case Some((user, roleName)) if securityModule.checkPassword(req.password, user.passwordHash) =>
        val token = securityModule.generateToken(user.id.toString, roleName, 86400)
        auditLogService.logAction(Some(user.id), "USER_LOGIN", "users", Some(user.id), Some(s"User logged in: ${user.email}"))
        LoginResponse(token, UserResponse(user.id, user.name, user.email, roleName))
      case _ =>
        throw AuthenticationException("Invalid email or password")
    }
  }

  def register(req: UserRegistrationRequest): UserResponse = {
    Validator.validateEmail(req.email)
    Validator.validateLength(req.name, 2, 100, "name")
    val rawPassword = req.password.getOrElse(throw AuthenticationException("Password is required for registration"))
    Validator.validateLength(rawPassword, 6, 50, "password")

    repo.findByEmail(req.email).foreach { _ =>
      throw ConflictException(s"Email '${req.email}' is already registered")
    }

    val roleId = repo.getRoleIdByName(req.role.toUpperCase).getOrElse {
      throw NotFoundException(s"Role '${req.role}' not found")
    }

    val id = UUID.randomUUID()
    val passwordHash = securityModule.hashPassword(rawPassword)
    val user = User(id, req.name, req.email, passwordHash, roleId)

    repo.create(user)
    auditLogService.logAction(None, "USER_REGISTERED", "users", Some(id), Some(s"User registered: ${user.email} with role ${req.role}"))
    UserResponse(id, user.name, user.email, req.role.toUpperCase)
  }

  def getUserById(userId: UUID): Option[UserResponse] = {
    repo.findById(userId).map { case (user, roleName) =>
      UserResponse(user.id, user.name, user.email, roleName)
    }
  }
}
