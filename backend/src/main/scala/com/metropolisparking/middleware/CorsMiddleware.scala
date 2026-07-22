package com.metropolisparking.middleware

import akka.http.scaladsl.model.HttpMethods._
import akka.http.scaladsl.model.headers._
import akka.http.scaladsl.model.{HttpResponse, StatusCodes}
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route

object CorsMiddleware {
  def corsHandler(r: Route): Route = {
    optionalHeaderValueByType(Origin) { maybeOrigin =>
      val originHeader = maybeOrigin match {
        case Some(origin) if origin.origins.nonEmpty => 
          `Access-Control-Allow-Origin`(HttpOriginRange(origin.origins.head))
        case _ => 
          `Access-Control-Allow-Origin`.*
      }

      val responseHeaders = List(
        originHeader,
        `Access-Control-Allow-Credentials`(true),
        `Access-Control-Allow-Headers`("Authorization", "Content-Type", "X-Correlation-ID"),
        `Access-Control-Allow-Methods`(OPTIONS, GET, POST, PUT, DELETE, PATCH)
      )

      respondWithHeaders(responseHeaders) {
        options {
          complete(HttpResponse(StatusCodes.OK))
        } ~ r
      }
    }
  }
}
