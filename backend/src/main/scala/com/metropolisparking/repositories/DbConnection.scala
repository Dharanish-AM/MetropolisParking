package com.metropolisparking.repositories

import com.metropolisparking.config.DbConfig
import com.zaxxer.hikari.{HikariConfig, HikariDataSource}
import org.jooq.impl.DSL
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
    new HikariDataSource(hikariConfig)
  }

  def createDslContext(dataSource: javax.sql.DataSource): DSLContext = {
    DSL.using(dataSource, SQLDialect.POSTGRES)
  }
}
