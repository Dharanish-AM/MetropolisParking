package com.metropolisparking.services

import org.jooq.DSLContext
import org.slf4j.LoggerFactory
import java.math.BigDecimal
import java.time.{ZoneId, ZonedDateTime, LocalDate}
import java.util.UUID
import scala.util.Random
import scala.jdk.CollectionConverters._

class DatabaseSeederService(dslContext: DSLContext) {
  private val logger = LoggerFactory.getLogger(getClass)
  private val rand = new Random(42)

  def ensureSeeded(): Unit = {
    try {
      val today = LocalDate.now(ZoneId.of("Asia/Kolkata"))
      val todayCount = dslContext.resultQuery(
        "SELECT COUNT(*) FROM parking_sessions WHERE DATE(entry_time) = CURRENT_DATE"
      ).fetchOne(0, classOf[java.lang.Integer])

      if (todayCount == null || todayCount == 0) {
        logger.info("No parking sessions found for today ({}) - executing dynamic current-time auto-seed...", today)
        seedDynamicData()
      } else {
        logger.info("Database already seeded with {} sessions for today ({})", todayCount, today)
      }
    } catch {
      case ex: Throwable =>
        logger.error("Error during dynamic auto-seed check", ex)
    }
  }

  def seedDynamicData(): Unit = {
    val zone = ZoneId.of("Asia/Kolkata")
    val now = ZonedDateTime.now(zone)

    val spaces = dslContext.resultQuery("SELECT id, space_number, lot_id FROM parking_spaces").fetch()
    val vehicles = dslContext.resultQuery("SELECT id, plate_number, type FROM vehicles").fetch()

    if (spaces.isEmpty || vehicles.isEmpty) {
      logger.warn("Missing core master data (spaces/vehicles). Skipping dynamic session seeding.")
      return
    }

    val methods = Array("CARD", "CASH", "UPI")

    for (dayOffset <- (0 to 29).reverse) {
      val dayDate = now.minusDays(dayOffset)
      val sessionCount = if (dayOffset == 0) 14 else (15 + rand.nextInt(15))

      for (_ <- 1 to sessionCount) {
        val hour = 7 + rand.nextInt(13)
        val minute = rand.nextInt(60)
        val entryTime = dayDate.withHour(hour).withMinute(minute).withSecond(0).toInstant
        val durationMins = 30 + rand.nextInt(240)
        val exitTime = entryTime.plusSeconds(durationMins * 60)

        if (exitTime.isBefore(now.toInstant)) {
          val spaceRec = spaces.get(rand.nextInt(spaces.size()))
          val vehicleRec = vehicles.get(rand.nextInt(vehicles.size()))
          val spaceId = UUID.fromString(spaceRec.get("id").toString)
          val vehicleId = UUID.fromString(vehicleRec.get("id").toString)
          val sessionId = UUID.randomUUID()
          val paymentId = UUID.randomUUID()

          val hourlyRate = 30.0 + (rand.nextInt(6) * 10.0)
          val hours = Math.max(1, Math.ceil(durationMins / 60.0).toInt)
          val fee = BigDecimal.valueOf(hours * hourlyRate)
          val method = methods(rand.nextInt(methods.length))

          dslContext.execute(
            """INSERT INTO parking_sessions (id, vehicle_id, space_id, entry_time, exit_time, duration_minutes, fee)
              |VALUES (?::uuid, ?::uuid, ?::uuid, ?::timestamptz, ?::timestamptz, ?, ?)
              |ON CONFLICT (id) DO NOTHING""".stripMargin,
            sessionId, vehicleId, spaceId, entryTime.toString, exitTime.toString,
            java.lang.Integer.valueOf(durationMins), fee
          )

          dslContext.execute(
            """INSERT INTO payments (id, session_id, amount, method, status, created_at)
              |VALUES (?::uuid, ?::uuid, ?, ?, 'SETTLED', ?::timestamptz)
              |ON CONFLICT (id) DO NOTHING""".stripMargin,
            paymentId, sessionId, fee, method, exitTime.toString
          )
        }
      }
    }

    val availableSpaceList = spaces.asScala.toList
    val activeCount = Math.min(6, availableSpaceList.size)
    for (i <- 0 until activeCount) {
      val spaceRec = availableSpaceList(i)
      val vehicleRec = vehicles.get(i % vehicles.size())
      val spaceId = UUID.fromString(spaceRec.get("id").toString)
      val vehicleId = UUID.fromString(vehicleRec.get("id").toString)
      val sessionId = UUID.randomUUID()
      val entryTime = now.minusMinutes(15 + rand.nextInt(90)).toInstant

      dslContext.execute(
        """INSERT INTO parking_sessions (id, vehicle_id, space_id, entry_time, exit_time, duration_minutes, fee)
          |VALUES (?::uuid, ?::uuid, ?::uuid, ?::timestamptz, NULL, NULL, NULL)
          |ON CONFLICT (id) DO NOTHING""".stripMargin,
        sessionId, vehicleId, spaceId, entryTime.toString
      )

      dslContext.execute(
        "UPDATE parking_spaces SET status = 'OCCUPIED' WHERE id = ?::uuid",
        spaceId
      )
    }

    logger.info("Dynamic current-time seeding completed for today ({}) and past 30 days!", now.toLocalDate)
  }
}
