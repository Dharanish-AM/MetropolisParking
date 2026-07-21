package com.metropolisparking.routes

import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route
import com.metropolisparking.dto.DtoFormats._
import com.metropolisparking.middleware.RbacMiddleware
import com.metropolisparking.services.DashboardService

class DashboardRoutes(service: DashboardService, rbac: RbacMiddleware) {
  val routes: Route = {
    path("dashboard") {
      get {
        rbac.authorizeRoles(Set("ADMIN", "OPERATOR")) { claims =>
          complete(service.getStats())
        }
      }
    }
  }
}
