package com.metropolisparking.routes

import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import akka.http.scaladsl.model.StatusCodes
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route
import spray.json.DefaultJsonProtocol._
import spray.json.RootJsonFormat

import scala.concurrent.{ExecutionContext, Future}
import scala.util.{Success, Failure}

case class HealthResponse(status: String)

object HealthResponse {
  implicit val healthResponseFormat: RootJsonFormat[HealthResponse] = jsonFormat1(HealthResponse.apply)
}

class HealthRoute(checkDb: () => Future[Boolean])(implicit ec: ExecutionContext) {
  val route: Route =
    path("health") {
      get {
        onComplete(checkDb()) {
          case Success(true) =>
            complete(StatusCodes.OK -> HealthResponse("UP"))
          case Success(false) | Failure(_) =>
            complete(StatusCodes.ServiceUnavailable -> HealthResponse("DOWN"))
        }
      }
    }
}
