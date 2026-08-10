package com.metropolisparking.routes

import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route
import com.metropolisparking.dto._
import com.metropolisparking.dto.DtoFormats._
import com.metropolisparking.exceptions.NotFoundException
import com.metropolisparking.middleware.RbacMiddleware
import com.metropolisparking.services.PricingRuleService
import com.metropolisparking.utils.JsonFormats._
import java.time.Instant
import java.util.UUID

class PricingRuleRoutes(service: PricingRuleService, rbac: RbacMiddleware) {
  private val innerRoutes: Route =
    concat(
      pathEndOrSingleSlash {
        concat(
          get {
            complete(service.list())
          },
          post {
            rbac.authorizeRoles(Set("ADMIN", "OPERATOR")) { claims =>
              entity(as[PricingRuleCreateRequest]) { req =>
                val userId = UUID.fromString(claims.userId)
                complete(service.create(req, Some(userId)))
              }
            }
          }
        )
      },
      path("calculate-preview") {
        post {
          entity(as[PricingCalculateRequest]) { req =>
            val entry = Instant.parse(req.entryTime)
            val exit = Instant.parse(req.exitTime)
            val result = service.calculateFee(entry, exit, req.lotId, req.vehicleType)
            complete(result)
          }
        }
      },
      path(JavaUUID) { ruleId =>
        concat(
          get {
            service.getById(ruleId) match {
              case Some(rule) => complete(rule)
              case None       => throw NotFoundException(s"Pricing rule '$ruleId' not found")
            }
          },
          put {
            rbac.authorizeRoles(Set("ADMIN", "OPERATOR")) { claims =>
              entity(as[PricingRuleCreateRequest]) { req =>
                val userId = UUID.fromString(claims.userId)
                complete(service.update(ruleId, req, Some(userId)))
              }
            }
          },
          delete {
            rbac.authorizeRoles(Set("ADMIN")) { claims =>
              val userId = UUID.fromString(claims.userId)
              service.delete(ruleId, Some(userId))
              complete(Map("message" -> s"Pricing rule '$ruleId' deleted successfully"))
            }
          }
        )
      }
    )

  val routes: Route =
    pathPrefix("pricing-rules") { innerRoutes } ~
    pathPrefix("api" / "pricing-rules") { innerRoutes }
}
