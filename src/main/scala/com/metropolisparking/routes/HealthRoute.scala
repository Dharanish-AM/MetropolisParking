package com.metropolisparking.routes

import org.apache.pekko.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import org.apache.pekko.http.scaladsl.model.StatusCodes
import org.apache.pekko.http.scaladsl.server.Directives._
import org.apache.pekko.http.scaladsl.server.Route
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
