package com.metropolisparking.middleware

import akka.http.scaladsl.server.Directive0
import akka.http.scaladsl.server.Directives._
import org.slf4j.{LoggerFactory, MDC}
import java.util.UUID

object LoggingMiddleware {
  private val logger = LoggerFactory.getLogger("com.metropolisparking.requests")

  def correlationIdDirective: Directive0 = {
    extractRequest.flatMap { req =>
      val correlationId = req.headers.find(_.name().equalsIgnoreCase("X-Correlation-ID"))
        .map(_.value())
        .getOrElse(UUID.randomUUID().toString)

      MDC.put("correlationId", correlationId)
      val startTime = System.currentTimeMillis()

      logger.info(s"Request: ${req.method.value} ${req.uri.path}")

      mapResponse { resp =>
        val duration = System.currentTimeMillis() - startTime
        logger.info(s"Response: ${resp.status.value} in ${duration}ms")
        MDC.remove("correlationId")
        resp
      }
    }
  }
}
