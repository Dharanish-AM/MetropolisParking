package com.metropolisparking.config

import com.typesafe.config.ConfigFactory
import pureconfig.ConfigSource
import pureconfig.generic.auto._

case class HttpConfig(host: String, port: Int)
case class AppSettings(environment: String)
case class AppConfig(app: AppSettings, http: HttpConfig)

object AppConfig {
  private val SupportedEnvironments = Set("local", "dev", "test", "production")

  /**
   * Loads the application configuration driven by the APP_ENV environment variable.
   * If APP_ENV is not specified, it defaults to 'local'.
   */
  def load(): AppConfig = {
    val env = sys.props
      .get("APP_ENV")
      .orElse(sys.env.get("APP_ENV"))
      .getOrElse("local")

    require(
      SupportedEnvironments.contains(env),
      s"Unsupported APP_ENV '$env'. Supported values: ${SupportedEnvironments.toList.sorted.mkString(", ")}"
    )

    // Load application-{env}.conf which overrides application.conf
    val configName = s"application-$env"
    val rawConfig = ConfigFactory.load(configName).resolve()

    ConfigSource.fromConfig(rawConfig).loadOrThrow[AppConfig]
  }
}
