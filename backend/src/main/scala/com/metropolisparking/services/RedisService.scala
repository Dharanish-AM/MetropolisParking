package com.metropolisparking.services

import com.metropolisparking.telemetry.TelemetryModule
import io.opentelemetry.api.common.AttributeKey
import io.opentelemetry.api.common.Attributes
import io.opentelemetry.api.trace.StatusCode
import redis.clients.jedis.JedisPool
import redis.clients.jedis.JedisPoolConfig
import org.slf4j.LoggerFactory
import scala.util.Try

class RedisService(host: String = "localhost", port: Int = 6379) {
  private val logger = LoggerFactory.getLogger(classOf[RedisService])

  private val pool: Option[JedisPool] = Try {
    val config = new JedisPoolConfig()
    config.setMaxTotal(16)
    config.setMaxIdle(8)
    config.setTestOnBorrow(true)
    new JedisPool(config, host, port, 2000)
  }.toOption

  private def traceOp[T](operation: String, key: String)(block: => T): T = {
    val span = TelemetryModule.tracer
      .spanBuilder(s"Redis $operation")
      .setAttribute(AttributeKey.stringKey("db.system"), "redis")
      .setAttribute(AttributeKey.stringKey("db.operation"), operation)
      .setAttribute(AttributeKey.stringKey("redis.key"), key)
      .startSpan()

    val startTime = System.currentTimeMillis()
    try {
      val result = block
      span.setStatus(StatusCode.OK)
      val duration = System.currentTimeMillis() - startTime
      val attrs = Attributes.of(
        AttributeKey.stringKey("operation"), operation,
        AttributeKey.stringKey("status"), "success"
      )
      TelemetryModule.redisOpDuration.record(duration.toDouble, attrs)
      TelemetryModule.redisOpsTotal.add(1L, attrs)
      result
    } catch {
      case ex: Throwable =>
        span.setStatus(StatusCode.ERROR, ex.getMessage)
        span.recordException(ex)
        val duration = System.currentTimeMillis() - startTime
        val attrs = Attributes.of(
          AttributeKey.stringKey("operation"), operation,
          AttributeKey.stringKey("status"), "error"
        )
        TelemetryModule.redisOpDuration.record(duration.toDouble, attrs)
        TelemetryModule.redisOpsTotal.add(1L, attrs)
        throw ex
    } finally {
      span.end()
    }
  }

  def get(key: String): Option[String] = traceOp("GET", key) {
    pool.flatMap { p =>
      Try {
        val jedis = p.getResource
        try {
          Option(jedis.get(key))
        } finally {
          jedis.close()
        }
      }.toOption.flatten
    }
  }

  def setEx(key: String, seconds: Int, value: String): Boolean = traceOp("SETEX", key) {
    pool.exists { p =>
      Try {
        val jedis = p.getResource
        try {
          jedis.setex(key, seconds, value)
          true
        } finally {
          jedis.close()
        }
      }.getOrElse(false)
    }
  }

  def del(key: String): Unit = traceOp("DEL", key) {
    pool.foreach { p =>
      Try {
        val jedis = p.getResource
        try {
          jedis.del(key)
        } finally {
          jedis.close()
        }
      }
    }
  }

  def isHealthy: Boolean = traceOp("PING", "health") {
    pool.exists { p =>
      Try {
        val jedis = p.getResource
        try {
          jedis.ping() == "PONG"
        } finally {
          jedis.close()
        }
      }.getOrElse(false)
    }
  }
}
