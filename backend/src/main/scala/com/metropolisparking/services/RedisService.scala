package com.metropolisparking.services

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

  def get(key: String): Option[String] = {
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

  def setEx(key: String, seconds: Int, value: String): Boolean = {
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

  def del(key: String): Unit = {
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

  def isHealthy: Boolean = {
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
