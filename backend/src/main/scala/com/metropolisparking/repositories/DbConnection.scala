package com.metropolisparking.repositories

import com.metropolisparking.config.DbConfig
import com.metropolisparking.telemetry.{JooqTelemetryListener, TelemetryModule}
import com.zaxxer.hikari.{HikariConfig, HikariDataSource}
import org.jooq.impl.{DSL, DefaultConfiguration}
import org.jooq.{DSLContext, SQLDialect}

object DbConnection {
  def createDataSource(config: DbConfig): HikariDataSource = {
    val hikariConfig = new HikariConfig()
    hikariConfig.setJdbcUrl(config.url)
    hikariConfig.setUsername(config.username)
    hikariConfig.setPassword(config.password)
    hikariConfig.setDriverClassName("org.postgresql.Driver")
    hikariConfig.setMaximumPoolSize(10)
    hikariConfig.setMinimumIdle(2)
    val ds = new HikariDataSource(hikariConfig)
    TelemetryModule.registerHikariMetrics(ds)
    ds
  }

  def createDslContext(dataSource: javax.sql.DataSource): DSLContext = {
    val configuration = new DefaultConfiguration()
      .set(dataSource)
      .set(SQLDialect.POSTGRES)
    configuration.set(new JooqTelemetryListener())
    DSL.using(configuration)
  }
}
