package com.metropolisparking.routes

import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import akka.http.scaladsl.model.StatusCodes
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route
import spray.json.DefaultJsonProtocol._
import spray.json.RootJsonFormat

case class HealthResponse(status: String)

object HealthResponse {
  implicit val healthResponseFormat: RootJsonFormat[HealthResponse] = jsonFormat1(HealthResponse.apply)
}

class HealthRoute {
  val route: Route =
    path("health") {
      get {
        complete(StatusCodes.OK -> HealthResponse("UP"))
      }
    }
}
