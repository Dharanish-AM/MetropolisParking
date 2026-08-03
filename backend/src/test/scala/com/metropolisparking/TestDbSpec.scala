package com.metropolisparking

import com.metropolisparking.config.AppConfig
import com.metropolisparking.jooq.Tables._
import com.metropolisparking.repositories.DbConnection
import org.flywaydb.core.Flyway
import org.jooq.DSLContext
import org.scalatest.{BeforeAndAfterAll, BeforeAndAfterEach}
import org.scalatest.funspec.AnyFunSpec

trait TestDbSpec extends BeforeAndAfterAll with BeforeAndAfterEach { this: AnyFunSpec =>
  private val config = AppConfig.load()
  private val dataSource = DbConnection.createDataSource(config.db)
  val dslContext: DSLContext = DbConnection.createDslContext(dataSource)

  override def beforeAll(): Unit = {
    val flyway = Flyway.configure()
      .dataSource(config.db.url, config.db.username, config.db.password)
      .load()
    flyway.repair()
    flyway.migrate()
  }

  override def afterEach(): Unit = {
    dslContext.transaction { configuration =>
      val ctx = configuration.dsl()
      ctx.execute("DELETE FROM payments")
      ctx.execute("DELETE FROM parking_sessions")
      ctx.execute("DELETE FROM reservations")
      ctx.execute("DELETE FROM pricing_rules WHERE lot_id NOT IN (SELECT id FROM parking_lots WHERE name IN ('BKC Cyber City Plaza','UB City Luxury Parking','Connaught Place Central Hub','HITEC City Tech Park Parkade','Express Avenue Mall Plaza','Phoenix Marketcity Garage','Sector 18 Commercial Complex','Cyber Hub Transit Tower'))")
      ctx.execute("DELETE FROM parking_spaces WHERE lot_id NOT IN (SELECT id FROM parking_lots WHERE name IN ('BKC Cyber City Plaza','UB City Luxury Parking','Connaught Place Central Hub','HITEC City Tech Park Parkade','Express Avenue Mall Plaza','Phoenix Marketcity Garage','Sector 18 Commercial Complex','Cyber Hub Transit Tower'))")
      ctx.execute("DELETE FROM parking_levels WHERE lot_id NOT IN (SELECT id FROM parking_lots WHERE name IN ('BKC Cyber City Plaza','UB City Luxury Parking','Connaught Place Central Hub','HITEC City Tech Park Parkade','Express Avenue Mall Plaza','Phoenix Marketcity Garage','Sector 18 Commercial Complex','Cyber Hub Transit Tower'))")
      ctx.execute("DELETE FROM parking_lots WHERE name NOT IN ('BKC Cyber City Plaza','UB City Luxury Parking','Connaught Place Central Hub','HITEC City Tech Park Parkade','Express Avenue Mall Plaza','Phoenix Marketcity Garage','Sector 18 Commercial Complex','Cyber Hub Transit Tower')")
      ctx.execute("DELETE FROM vehicles WHERE owner_id IS NULL OR owner_id IN (SELECT id FROM users WHERE email LIKE '%@example.com') OR plate_number IN ('MH12AB1234', 'KA01CD5678', 'DL01EF9012', 'ANPR123', 'UNKNOWN9999')")
      ctx.execute("DELETE FROM audit_logs WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@example.com') OR details LIKE '%Test%'")
      ctx.execute("DELETE FROM users WHERE email LIKE '%@example.com'")
    }
  }

  override def afterAll(): Unit = {
    dataSource.close()
  }
}
