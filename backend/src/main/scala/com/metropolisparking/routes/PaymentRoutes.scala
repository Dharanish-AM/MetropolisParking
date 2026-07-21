package com.metropolisparking.routes

import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route
import com.metropolisparking.dto.PaymentProcessRequest
import com.metropolisparking.dto.DtoFormats._
import com.metropolisparking.middleware.RbacMiddleware
import com.metropolisparking.services.PaymentService
import com.metropolisparking.utils.JsonFormats._
import java.util.UUID

class PaymentRoutes(service: PaymentService, rbac: RbacMiddleware) {
  val routes: Route = {
    pathPrefix("payments") {
      concat(
        pathEndOrSingleSlash {
          get {
            rbac.authorizeRoles(Set("ADMIN", "OPERATOR")) { claims =>
              complete(service.list())
            }
          }
        },
        path(JavaUUID) { paymentId =>
          post {
            rbac.authenticateUser { claims =>
              entity(as[PaymentProcessRequest]) { req =>
                val userId = UUID.fromString(claims.userId)
                complete(service.processPayment(paymentId, req, Some(userId)))
              }
            }
          }
        }
      )
    }
  }
}
