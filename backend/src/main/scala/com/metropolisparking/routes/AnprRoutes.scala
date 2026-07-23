package com.metropolisparking.routes

import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route
import com.metropolisparking.dto.{AnprEntryRequest, AnprExitRequest}
import com.metropolisparking.dto.DtoFormats._
import com.metropolisparking.middleware.RbacMiddleware
import com.metropolisparking.services.AnprService
import com.metropolisparking.utils.JsonFormats._

class AnprRoutes(service: AnprService, rbac: RbacMiddleware) {
  val routes: Route = {
    pathPrefix("anpr") {
      rbac.authorizeRoles(Set("ADMIN", "OPERATOR")) { claims =>
        concat(
          path("entry") {
            post {
              entity(as[AnprEntryRequest]) { req =>
                complete(service.simulateEntry(req))
              }
            }
          },
          path("exit") {
            post {
              entity(as[AnprExitRequest]) { req =>
                complete(service.simulateExit(req))
              }
            }
          }
        )
      }
    }
  }
}
