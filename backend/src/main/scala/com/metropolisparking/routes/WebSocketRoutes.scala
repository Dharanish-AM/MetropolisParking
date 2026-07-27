package com.metropolisparking.routes

import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route
import com.metropolisparking.services.WebSocketService

class WebSocketRoutes(wsService: WebSocketService) {
  val routes: Route =
    path("ws") {
      handleWebSocketMessages(wsService.websocketFlow())
    }
}
