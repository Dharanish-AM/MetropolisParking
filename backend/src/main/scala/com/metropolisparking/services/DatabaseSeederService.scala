package com.metropolisparking.services

import org.jooq.DSLContext
import org.jooq.impl.DSL
import org.slf4j.LoggerFactory
import scala.io.Source

class DatabaseSeederService(dslContext: DSLContext) {
  private val logger = LoggerFactory.getLogger(getClass)

  def ensureSeeded(): Unit = {
    try {
      val lotCount = dslContext.fetchCount(DSL.table(DSL.name("parking_lots")))
      val paymentCount = dslContext.fetchCount(DSL.table(DSL.name("payments")))

      if (lotCount == 0 || paymentCount == 0) {
        logger.info("Database seed check triggered (lotCount: {}, paymentCount: {}). Executing V12 seed...", lotCount, paymentCount)
        val seedStream = getClass.getResourceAsStream("/db/migration/V12__seed_production_data.sql")
        if (seedStream != null) {
          val sql = Source.fromInputStream(seedStream)("UTF-8").mkString
          dslContext.execute(sql)
          logger.info("Database V12 auto-seeding completed successfully")
        }
      }
    } catch {
      case ex: Throwable =>
        logger.error("Error during database auto-seed check", ex)
    }
  }
}
