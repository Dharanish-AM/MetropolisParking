package com.metropolisparking.routes

import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route
import com.metropolisparking.dto.ReservationCreateRequest
import com.metropolisparking.dto.DtoFormats._
import com.metropolisparking.middleware.RbacMiddleware
import com.metropolisparking.services.ReservationService
import com.metropolisparking.utils.JsonFormats._
import java.util.UUID

class ReservationRoutes(service: ReservationService, rbac: RbacMiddleware) {
  val routes: Route = {
    pathPrefix("reservations") {
      rbac.authenticateUser { claims =>
        val userId = UUID.fromString(claims.userId)
        val role = claims.role
        concat(
          pathEndOrSingleSlash {
            concat(
              get {
                complete(service.listReservations(userId, role))
              },
              post {
                entity(as[ReservationCreateRequest]) { req =>
                  complete(service.makeReservation(req, userId))
                }
              }
            )
          },
          path(JavaUUID) { id =>
            delete {
              service.cancelReservation(id, userId, role)
              complete(Map("message" -> "Reservation cancelled successfully"))
            }
          }
        )
      }
    }
  }
}
