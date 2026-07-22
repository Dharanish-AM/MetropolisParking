package com.metropolisparking.routes

import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route
import com.metropolisparking.dto.{ParkingLotCreateRequest, LevelCreateRequest}
import com.metropolisparking.dto.DtoFormats._
import com.metropolisparking.exceptions.NotFoundException
import com.metropolisparking.middleware.RbacMiddleware
import com.metropolisparking.services.ParkingLotService
import com.metropolisparking.utils.JsonFormats._
import java.util.UUID

class ParkingLotRoutes(service: ParkingLotService, rbac: RbacMiddleware) {
  val routes: Route = {
    pathPrefix("parking-lots") {
      concat(
        pathEndOrSingleSlash {
          concat(
            get {
              complete(service.listLots())
            },
            post {
              rbac.authorizeRoles(Set("ADMIN", "OPERATOR")) { claims =>
                entity(as[ParkingLotCreateRequest]) { req =>
                  val userId = UUID.fromString(claims.userId)
                  complete(service.createLot(req, Some(userId)))
                }
              }
            }
          )
        },
        pathPrefix(JavaUUID) { lotId =>
          concat(
            pathEndOrSingleSlash {
              concat(
                get {
                  service.getLot(lotId) match {
                    case Some(lot) => complete(lot)
                    case None => throw NotFoundException(s"Parking lot '$lotId' not found")
                  }
                },
                put {
                  rbac.authorizeRoles(Set("ADMIN", "OPERATOR")) { claims =>
                    entity(as[ParkingLotCreateRequest]) { req =>
                      val userId = UUID.fromString(claims.userId)
                      complete(service.updateLot(lotId, req, Some(userId)))
                    }
                  }
                },
                delete {
                  rbac.authorizeRoles(Set("ADMIN")) { claims =>
                    val userId = UUID.fromString(claims.userId)
                    service.deleteLot(lotId, Some(userId))
                    complete(Map("message" -> s"Parking lot '$lotId' deleted successfully"))
                  }
                }
              )
            },
            path("levels") {
              concat(
                get {
                  complete(service.listLevels(lotId))
                },
                post {
                  rbac.authorizeRoles(Set("ADMIN", "OPERATOR")) { claims =>
                    entity(as[LevelCreateRequest]) { req =>
                      val userId = UUID.fromString(claims.userId)
                      complete(service.createLevel(lotId, req.levelNumber, Some(userId)))
                    }
                  }
                }
              )
            }
          )
        }
      )
    }
  }
}
