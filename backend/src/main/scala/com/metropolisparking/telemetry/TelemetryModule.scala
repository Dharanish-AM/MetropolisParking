package com.metropolisparking.telemetry

import com.zaxxer.hikari.HikariDataSource
import io.opentelemetry.api.OpenTelemetry
import io.opentelemetry.api.common.AttributeKey
import io.opentelemetry.api.common.Attributes
import io.opentelemetry.api.metrics.DoubleHistogram
import io.opentelemetry.api.metrics.LongCounter
import io.opentelemetry.api.metrics.Meter
import io.opentelemetry.api.trace.Tracer
import io.opentelemetry.exporter.otlp.trace.OtlpGrpcSpanExporter
import io.opentelemetry.exporter.prometheus.PrometheusHttpServer
import io.opentelemetry.instrumentation.runtimemetrics.java17.RuntimeMetrics
import io.opentelemetry.sdk.OpenTelemetrySdk
import io.opentelemetry.sdk.metrics.SdkMeterProvider
import io.opentelemetry.sdk.resources.Resource
import io.opentelemetry.sdk.trace.SdkTracerProvider
import io.opentelemetry.sdk.trace.export.BatchSpanProcessor
import org.slf4j.LoggerFactory
import scala.util.Try

object TelemetryModule {
  private val logger = LoggerFactory.getLogger(getClass)

  private val otlpEndpoint = sys.env.getOrElse("OTEL_EXPORTER_OTLP_ENDPOINT", "http://jaeger:4317")
  private val prometheusPort = sys.env.get("PROMETHEUS_PORT").flatMap(p => Try(p.toInt).toOption).getOrElse(9464)

  private val resource = Resource.getDefault.merge(
    Resource.create(Attributes.of(AttributeKey.stringKey("service.name"), "metropolis-parking-backend"))
  )

  private val otlpExporter = OtlpGrpcSpanExporter.builder()
    .setEndpoint(otlpEndpoint)
    .build()

  private val tracerProvider = SdkTracerProvider.builder()
    .setResource(resource)
    .addSpanProcessor(BatchSpanProcessor.builder(otlpExporter).build())
    .build()

  private val prometheusServer = PrometheusHttpServer.builder()
    .setPort(prometheusPort)
    .build()

  private val meterProvider = SdkMeterProvider.builder()
    .setResource(resource)
    .registerMetricReader(prometheusServer)
    .build()

  val openTelemetry: OpenTelemetry = OpenTelemetrySdk.builder()
    .setTracerProvider(tracerProvider)
    .setMeterProvider(meterProvider)
    .buildAndRegisterGlobal()

  Try {
    RuntimeMetrics.create(openTelemetry)
  }

  val tracer: Tracer = openTelemetry.getTracer("com.metropolisparking.backend")
  val meter: Meter = openTelemetry.getMeter("com.metropolisparking.backend")

  val httpDuration: DoubleHistogram = meter
    .histogramBuilder("http_server_duration_ms")
    .setDescription("HTTP request response duration in milliseconds")
    .setUnit("ms")
    .build()

  val httpRequestsTotal: LongCounter = meter
    .counterBuilder("http_server_requests_total")
    .setDescription("Total count of HTTP requests processed")
    .build()

  val dbQueryDuration: DoubleHistogram = meter
    .histogramBuilder("db_query_duration_ms")
    .setDescription("Database query execution duration in milliseconds")
    .setUnit("ms")
    .build()

  val dbQueriesTotal: LongCounter = meter
    .counterBuilder("db_queries_total")
    .setDescription("Total count of database queries executed")
    .build()

  val redisOpDuration: DoubleHistogram = meter
    .histogramBuilder("redis_op_duration_ms")
    .setDescription("Redis operation latency in milliseconds")
    .setUnit("ms")
    .build()

  val redisOpsTotal: LongCounter = meter
    .counterBuilder("redis_ops_total")
    .setDescription("Total count of Redis operations executed")
    .build()

  def registerHikariMetrics(dataSource: HikariDataSource): Unit = {
    meter.gaugeBuilder("db_connections_active")
      .setDescription("Active connections in HikariCP pool")
      .buildWithCallback { measurement =>
        Try(dataSource.getHikariPoolMXBean).foreach { pool =>
          measurement.record(pool.getActiveConnections.toDouble)
        }
      }

    meter.gaugeBuilder("db_connections_idle")
      .setDescription("Idle connections in HikariCP pool")
      .buildWithCallback { measurement =>
        Try(dataSource.getHikariPoolMXBean).foreach { pool =>
          measurement.record(pool.getIdleConnections.toDouble)
        }
      }

    meter.gaugeBuilder("db_connections_total")
      .setDescription("Total connections in HikariCP pool")
      .buildWithCallback { measurement =>
        Try(dataSource.getHikariPoolMXBean).foreach { pool =>
          measurement.record(pool.getTotalConnections.toDouble)
        }
      }

    meter.gaugeBuilder("db_threads_awaiting_connection")
      .setDescription("Threads awaiting a connection from HikariCP pool")
      .buildWithCallback { measurement =>
        Try(dataSource.getHikariPoolMXBean).foreach { pool =>
          measurement.record(pool.getThreadsAwaitingConnection.toDouble)
        }
      }
  }
}
