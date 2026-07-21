package com.metropolisparking.middleware

import akka.http.scaladsl.server.Directive1
import akka.http.scaladsl.server.Directives._
import com.metropolisparking.exceptions.{AuthenticationException, AuthorizationException}
import com.metropolisparking.security.{SecurityModule, UserClaims}
import scala.util.{Failure, Success}

class RbacMiddleware(securityModule: SecurityModule) {
  def authenticateUser: Directive1[UserClaims] = {
    optionalHeaderValueByName("Authorization").flatMap {
      case Some(header) if header.startsWith("Bearer ") =>
        val token = header.substring(7)
        securityModule.verifyToken(token) match {
          case Success(claims) => provide(claims)
          case Failure(_)      => throw AuthenticationException("Invalid or expired authentication token")
        }
      case _ =>
        throw AuthenticationException("Missing or invalid Authorization header")
    }
  }

  def authorizeRoles(allowedRoles: Set[String]): Directive1[UserClaims] = {
    authenticateUser.flatMap { claims =>
      if (allowedRoles.contains(claims.role)) {
        provide(claims)
      } else {
        throw AuthorizationException("Insufficient permissions to access this resource")
      }
    }
  }
}
