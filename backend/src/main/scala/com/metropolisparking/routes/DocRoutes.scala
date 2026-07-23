package com.metropolisparking.routes

import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route

class DocRoutes {
  val routes: Route =
    path("docs") {
      getFromResource("docs/index.html")
    } ~
    path("openapi.yaml") {
      getFromResource("docs/openapi.yaml")
    }
}
