package com.metropolisparking.config

import pureconfig.ConfigSource
import pureconfig.generic.auto._

case class HttpConfig(host: String, port: Int)
case class DbConfig(url: String, username: String, password: String)
case class JwtConfig(secret: String, expireDurationSeconds: Long)

case class AppConfig(
  appEnv: String,
  http: HttpConfig,
  db: DbConfig,
  jwt: JwtConfig
)

object AppConfig {
  def load(): AppConfig = {
    ConfigSource.default.loadOrThrow[AppConfig]
  }
}
