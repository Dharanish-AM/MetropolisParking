package com.metropolisparking.routes

import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route
import com.metropolisparking.dto.ParkingSpaceCreateRequest
import com.metropolisparking.dto.DtoFormats._
import com.metropolisparking.exceptions.NotFoundException
import com.metropolisparking.middleware.RbacMiddleware
import com.metropolisparking.services.ParkingLotService
import com.metropolisparking.utils.JsonFormats._
import java.util.UUID

class ParkingSpaceRoutes(service: ParkingLotService, rbac: RbacMiddleware) {
  val routes: Route = {
    pathPrefix("spaces") {
      concat(
        pathEndOrSingleSlash {
          concat(
            get {
              parameters("lotId".as[UUID].?, "levelId".as[UUID].?) { (lotId, levelId) =>
                complete(service.listSpaces(lotId, levelId))
              }
            },
            post {
              rbac.authorizeRoles(Set("ADMIN", "OPERATOR")) { claims =>
                entity(as[ParkingSpaceCreateRequest]) { req =>
                  val userId = UUID.fromString(claims.userId)
                  complete(service.createSpace(req, Some(userId)))
                }
              }
            }
          )
        },
        pathPrefix(JavaUUID) { spaceId =>
          concat(
            pathEndOrSingleSlash {
              concat(
                put {
                  rbac.authorizeRoles(Set("ADMIN", "OPERATOR")) { claims =>
                    entity(as[ParkingSpaceCreateRequest]) { req =>
                      val userId = UUID.fromString(claims.userId)
                      complete(service.updateSpace(spaceId, req, Some(userId)))
                    }
                  }
                },
                delete {
                  rbac.authorizeRoles(Set("ADMIN")) { claims =>
                    val userId = UUID.fromString(claims.userId)
                    service.deleteSpace(spaceId, Some(userId))
                    complete(Map("message" -> s"Parking space '$spaceId' deleted successfully"))
                  }
                }
              )
            },
            path("status") {
              put {
                rbac.authorizeRoles(Set("ADMIN", "OPERATOR")) { claims =>
                  entity(as[String]) { status =>
                    val userId = UUID.fromString(claims.userId)
                    complete(service.updateSpaceStatus(spaceId, status, Some(userId)))
                  }
                }
              }
            }
          )
        }
      )
    }
  }
}
