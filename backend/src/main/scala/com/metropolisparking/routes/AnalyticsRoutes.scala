package com.metropolisparking.routes

import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route
import com.metropolisparking.dto.DtoFormats._
import com.metropolisparking.middleware.RbacMiddleware
import com.metropolisparking.services.RevenueAnalyticsService
import java.util.UUID

class AnalyticsRoutes(analyticsService: RevenueAnalyticsService, rbac: RbacMiddleware) {
  private val innerRoutes: Route =
    path("revenue") {
      get {
        rbac.authorizeRoles(Set("ADMIN", "OPERATOR")) { _ =>
          parameter("lotId".as[UUID].?) { lotIdOpt =>
            complete(analyticsService.getAnalytics(lotIdOpt))
          }
        }
      }
    }

  val routes: Route =
    pathPrefix("analytics") { innerRoutes } ~
    pathPrefix("api" / "analytics") { innerRoutes }
}
