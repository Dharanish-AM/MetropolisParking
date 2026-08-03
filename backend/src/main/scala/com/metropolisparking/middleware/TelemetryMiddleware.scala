package com.metropolisparking.middleware

import akka.http.scaladsl.server.Directive0
import akka.http.scaladsl.server.Directives._
import com.metropolisparking.telemetry.TelemetryModule
import io.opentelemetry.api.common.AttributeKey
import io.opentelemetry.api.common.Attributes
import io.opentelemetry.api.trace.StatusCode
import io.opentelemetry.context.Scope

object TelemetryMiddleware {
  def traceRequests: Directive0 = {
    extractRequest.flatMap { req =>
      val method = req.method.value
      val path = req.uri.path.toString()

      val span = TelemetryModule.tracer
        .spanBuilder(s"HTTP $method $path")
        .setAttribute(AttributeKey.stringKey("http.method"), method)
        .setAttribute(AttributeKey.stringKey("http.target"), path)
        .startSpan()

      val scope: Scope = span.makeCurrent()
      val startTime = System.currentTimeMillis()

      mapResponse { resp =>
        val duration = System.currentTimeMillis() - startTime
        val statusCode = resp.status.intValue().toString

        if (resp.status.isFailure()) {
          span.setStatus(StatusCode.ERROR, resp.status.defaultMessage())
        } else {
          span.setStatus(StatusCode.OK)
        }

        span.setAttribute(AttributeKey.stringKey("http.status_code"), statusCode)
        span.end()
        scope.close()

        val attrs = Attributes.of(
          AttributeKey.stringKey("method"), method,
          AttributeKey.stringKey("path"), path,
          AttributeKey.stringKey("status"), statusCode
        )

        TelemetryModule.httpDuration.record(duration.toDouble, attrs)
        TelemetryModule.httpRequestsTotal.add(1L, attrs)

        resp
      }
    }
  }
}
