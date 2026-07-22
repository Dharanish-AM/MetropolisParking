package com.metropolisparking.routes

import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route
import com.metropolisparking.dto.VehicleCreateRequest
import com.metropolisparking.dto.DtoFormats._
import com.metropolisparking.middleware.RbacMiddleware
import com.metropolisparking.services.VehicleService
import com.metropolisparking.utils.JsonFormats._
import java.util.UUID

class VehicleRoutes(service: VehicleService, rbac: RbacMiddleware) {
  val routes: Route = {
    pathPrefix("vehicles") {
      concat(
        pathEndOrSingleSlash {
          concat(
            get {
              parameters("plateNumber".as[String].?) {
                case Some(plate) =>
                  complete(service.getByPlateNumber(plate).toList)
                case None =>
                  complete(service.list())
              }
            },
            post {
              rbac.authenticateUser { claims =>
                entity(as[VehicleCreateRequest]) { req =>
                  val userId = UUID.fromString(claims.userId)
                  complete(service.register(req, Some(userId)))
                }
              }
            }
          )
        }
      )
    }
  }
}
