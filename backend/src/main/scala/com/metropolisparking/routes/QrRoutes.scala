package com.metropolisparking.routes

import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route
import com.metropolisparking.dto.QrScanRequest
import com.metropolisparking.dto.DtoFormats._
import com.metropolisparking.middleware.RbacMiddleware
import com.metropolisparking.services.QrService
import com.metropolisparking.utils.JsonFormats._
import java.util.UUID

class QrRoutes(service: QrService, rbac: RbacMiddleware) {
  val routes: Route = {
    pathPrefix("qr") {
      rbac.authenticateUser { claims =>
        concat(
          path("generate") {
            get {
              parameters("entityType", "entityId") { (entityType, entityIdStr) =>
                val entityId = UUID.fromString(entityIdStr)
                complete(service.generatePass(entityType, entityId))
              }
            }
          },
          path("scan") {
            post {
              entity(as[QrScanRequest]) { req =>
                complete(service.scanPass(req.qrToken))
              }
            }
          }
        )
      }
    }
  }
}
