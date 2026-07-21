package com.metropolisparking.routes

import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route
import com.metropolisparking.dto.{LoginRequest, UserRegistrationRequest}
import com.metropolisparking.dto.DtoFormats._
import com.metropolisparking.exceptions.AuthenticationException
import com.metropolisparking.middleware.RbacMiddleware
import com.metropolisparking.services.AuthService
import com.metropolisparking.utils.JsonFormats._
import java.util.UUID

class AuthRoutes(authService: AuthService, rbac: RbacMiddleware) {
  val routes: Route = {
    pathPrefix("auth") {
      concat(
        path("login") {
          post {
            entity(as[LoginRequest]) { req =>
              complete(authService.login(req))
            }
          }
        },
        path("register") {
          post {
            entity(as[UserRegistrationRequest]) { req =>
              complete(authService.register(req))
            }
          }
        },
        path("logout") {
          post {
            complete(Map("message" -> "Logged out successfully"))
          }
        }
      )
    } ~
    path("me") {
      get {
        rbac.authenticateUser { claims =>
          val userId = UUID.fromString(claims.userId)
          authService.getUserById(userId) match {
            case Some(userResponse) => complete(userResponse)
            case None => throw AuthenticationException("User session is invalid")
          }
        }
      }
    }
  }
}
