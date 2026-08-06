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
      if (lotCount == 0) {
        logger.info("Database empty (0 parking_lots found). Triggering automatic seed initialization...")
        val seedStream = getClass.getResourceAsStream("/db/migration/V12__seed_production_data.sql")
        if (seedStream != null) {
          val sql = Source.fromInputStream(seedStream)("UTF-8").mkString
          dslContext.execute(sql)
          logger.info("Database V12 auto-seeding completed successfully")
        }
      }

      val paymentCount = dslContext.fetchCount(DSL.table(DSL.name("payments")))
      if (paymentCount == 0) {
        logger.info("No payment records found. Triggering V13 dashboard reseed initialization...")
        val seedStream = getClass.getResourceAsStream("/db/migration/V13__reseed_dashboard_data.sql")
        if (seedStream != null) {
          val sql = Source.fromInputStream(seedStream)("UTF-8").mkString
          dslContext.execute(sql)
          logger.info("Database V13 auto-seeding completed successfully")
        }
      }
    } catch {
      case ex: Throwable =>
        logger.error("Error during database auto-seed check", ex)
    }
  }
}
