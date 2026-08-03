package com.metropolisparking.telemetry

import io.opentelemetry.api.common.AttributeKey
import io.opentelemetry.api.common.Attributes
import io.opentelemetry.api.trace.Span
import io.opentelemetry.api.trace.StatusCode
import org.jooq.ExecuteContext
import org.jooq.impl.DefaultExecuteListener

class JooqTelemetryListener extends DefaultExecuteListener {
  override def renderEnd(ctx: ExecuteContext): Unit = {
    val sql = Option(ctx.sql()).getOrElse("UNKNOWN")
    val operation = extractOperation(sql)

    val span = TelemetryModule.tracer
      .spanBuilder(s"DB $operation")
      .setAttribute(AttributeKey.stringKey("db.system"), "postgresql")
      .setAttribute(AttributeKey.stringKey("db.statement"), sql)
      .setAttribute(AttributeKey.stringKey("db.operation"), operation)
      .startSpan()

    ctx.data("otel.span", span)
    ctx.data("otel.startTime", java.lang.Long.valueOf(System.currentTimeMillis()))
  }

  override def end(ctx: ExecuteContext): Unit = {
    Option(ctx.data("otel.span")).collect { case s: Span => s }.foreach { span =>
      val startTime = Option(ctx.data("otel.startTime")).collect { case t: java.lang.Long => t.longValue() }.getOrElse(System.currentTimeMillis())
      val duration = System.currentTimeMillis() - startTime
      val exception = Option(ctx.exception())

      val statusStr = if (exception.isDefined) {
        span.setStatus(StatusCode.ERROR, exception.get.getMessage)
        span.recordException(exception.get)
        "error"
      } else {
        span.setStatus(StatusCode.OK)
        "success"
      }

      span.end()

      val operation = extractOperation(Option(ctx.sql()).getOrElse(""))
      val attrs = Attributes.of(
        AttributeKey.stringKey("operation"), operation,
        AttributeKey.stringKey("status"), statusStr
      )

      TelemetryModule.dbQueryDuration.record(duration.toDouble, attrs)
      TelemetryModule.dbQueriesTotal.add(1L, attrs)
    }
  }

  private def extractOperation(sql: String): String = {
    val trimmed = sql.trim.toUpperCase
    if (trimmed.startsWith("SELECT")) "SELECT"
    else if (trimmed.startsWith("INSERT")) "INSERT"
    else if (trimmed.startsWith("UPDATE")) "UPDATE"
    else if (trimmed.startsWith("DELETE")) "DELETE"
    else "EXECUTE"
  }
}
