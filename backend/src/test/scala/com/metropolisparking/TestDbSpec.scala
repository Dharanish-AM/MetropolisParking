package com.metropolisparking

import com.metropolisparking.config.AppConfig
import com.metropolisparking.repositories.DbConnection
import org.jooq.DSLContext
import org.scalatest.BeforeAndAfterAll
import org.scalatest.funspec.AnyFunSpec

trait TestDbSpec extends BeforeAndAfterAll { this: AnyFunSpec =>
  private val config = AppConfig.load()
  private val dataSource = DbConnection.createDataSource(config.db)
  val dslContext: DSLContext = DbConnection.createDslContext(dataSource)

  override def afterAll(): Unit = {
    dataSource.close()
  }
}
