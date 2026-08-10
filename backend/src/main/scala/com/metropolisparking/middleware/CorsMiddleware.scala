package com.metropolisparking.middleware

import akka.http.scaladsl.model.HttpMethods._
import akka.http.scaladsl.model.headers._
import akka.http.scaladsl.model.{HttpResponse, StatusCodes}
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route

object CorsMiddleware {
  def corsHandler(r: Route): Route = {
    optionalHeaderValueByType(Origin) { maybeOrigin =>
      val (originHeader, includeCredentials) = maybeOrigin match {
        case Some(origin) if origin.origins.nonEmpty => 
          (`Access-Control-Allow-Origin`(HttpOriginRange(origin.origins.head)), true)
        case _ => 
          (`Access-Control-Allow-Origin`.*, false)
      }

      val baseHeaders = List(
        originHeader,
        `Access-Control-Allow-Headers`("Authorization", "Content-Type", "X-Correlation-ID"),
        `Access-Control-Allow-Methods`(OPTIONS, GET, POST, PUT, DELETE, PATCH)
      )

      val responseHeaders = if (includeCredentials) {
        `Access-Control-Allow-Credentials`(true) :: baseHeaders
      } else {
        baseHeaders
      }

      respondWithHeaders(responseHeaders) {
        options {
          complete(HttpResponse(StatusCodes.OK))
        } ~ r
      }
    }
  }
}
