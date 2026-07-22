package com.metropolisparking.routes

import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route
import com.metropolisparking.dto.{SessionStartRequest, SessionEndRequest}
import com.metropolisparking.dto.DtoFormats._
import com.metropolisparking.exceptions.NotFoundException
import com.metropolisparking.middleware.RbacMiddleware
import com.metropolisparking.services.ParkingSessionService
import com.metropolisparking.utils.JsonFormats._
import java.util.UUID

class ParkingSessionRoutes(service: ParkingSessionService, rbac: RbacMiddleware) {
  val routes: Route = {
    pathPrefix("sessions") {
      concat(
        pathEndOrSingleSlash {
          get {
            parameters("active".as[Boolean].?) { active =>
              complete(service.list(active.getOrElse(false)))
            }
          }
        },
        path("start") {
          post {
            rbac.authenticateUser { claims =>
              entity(as[SessionStartRequest]) { req =>
                val userId = UUID.fromString(claims.userId)
                complete(service.startSession(req, Some(userId)))
              }
            }
          }
        },
        path("end") {
          post {
            rbac.authenticateUser { claims =>
              entity(as[SessionEndRequest]) { req =>
                val userId = UUID.fromString(claims.userId)
                complete(service.endSession(req, Some(userId)))
              }
            }
          }
        },
        path("history") {
          get {
            parameters("plateNumber".as[String]) { plateNumber =>
              complete(service.getHistory(plateNumber))
            }
          }
        },
        path(JavaUUID) { sessionId =>
          get {
            service.getSession(sessionId) match {
              case Some(session) => complete(session)
              case None => throw NotFoundException(s"Session '$sessionId' not found")
            }
          }
        }
      )
    }
  }
}
