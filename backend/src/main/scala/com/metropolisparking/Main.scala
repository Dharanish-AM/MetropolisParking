package com.metropolisparking

import akka.actor.typed.ActorSystem
import akka.actor.typed.scaladsl.Behaviors
import akka.http.scaladsl.Http
import akka.http.scaladsl.server.Directives._
import scala.concurrent.ExecutionContextExecutor
import scala.util.{Failure, Success}

object Main {
  def main(args: Array[String]): Unit = {
    implicit val system: ActorSystem[Nothing] = ActorSystem(Behaviors.empty, "metropolis-parking-system")
    implicit val executionContext: ExecutionContextExecutor = system.executionContext

    val route =
      path("health") {
        get {
          complete("OK")
        }
      }

    val bindingFuture = Http().newServerAt("0.0.0.0", 8080).bind(route)

    bindingFuture.onComplete {
      case Success(binding) =>
        val address = binding.localAddress
        system.log.info(s"Server online at http://${address.getHostString}:${address.getPort}/")
      case Failure(ex) =>
        system.log.error(s"Failed to bind HTTP endpoint, terminating system", ex)
        system.terminate()
    }
  }
}
