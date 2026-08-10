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
      val activeSessionCount = dslContext.resultQuery(
        "SELECT COUNT(*) FROM parking_sessions WHERE exit_time IS NULL"
      ).fetchOne(0, classOf[java.lang.Integer])

      val activeResCount = dslContext.resultQuery(
        "SELECT COUNT(*) FROM reservations WHERE status IN ('CONFIRMED', 'PENDING')"
      ).fetchOne(0, classOf[java.lang.Integer])

      if (activeSessionCount == null || activeSessionCount < 3 || activeResCount == null || activeResCount < 3) {
        logger.info("Database seed check triggered - executing dynamic comprehensive auto-seed...", today)
        seedDynamicData()
      } else {
        logger.info("Database already fully seeded with {} active sessions and {} active reservations ({})", activeSessionCount, activeResCount, today)
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
    val usersList = dslContext.resultQuery("SELECT id, email, role_id FROM users").fetch()

    if (spaces.isEmpty) {
      logger.warn("Missing core master data (parking spaces). Skipping dynamic seeding.")
      return
    }

    val adminUserRec = usersList.asScala.find(r => Option(r.get("email")).map(_.toString).contains("admin@metropolisparking.com"))
    val customerUserRec = usersList.asScala.find(r => Option(r.get("email")).map(_.toString).contains("customer@metropolisparking.com"))

    val adminUserId = adminUserRec.map(r => UUID.fromString(r.get("id").toString)).getOrElse(UUID.randomUUID())
    val customerUserId = customerUserRec.map(r => UUID.fromString(r.get("id").toString)).getOrElse(UUID.randomUUID())

    val adminVehicleId = UUID.randomUUID()
    val customerVehicleId = UUID.randomUUID()

    dslContext.execute(
      """INSERT INTO vehicles (id, plate_number, type, owner_id)
        |VALUES (?::uuid, 'MH01AD8888', 'CAR', ?::uuid)
        |ON CONFLICT (plate_number) DO UPDATE SET owner_id = EXCLUDED.owner_id""".stripMargin,
      adminVehicleId, adminUserId
    )

    dslContext.execute(
      """INSERT INTO vehicles (id, plate_number, type, owner_id)
        |VALUES (?::uuid, 'KA01CS9999', 'SUV', ?::uuid)
        |ON CONFLICT (plate_number) DO UPDATE SET owner_id = EXCLUDED.owner_id""".stripMargin,
      customerVehicleId, customerUserId
    )

    val updatedVehicles = dslContext.resultQuery("SELECT id, plate_number, type, owner_id FROM vehicles").fetch()

    val methods = Array("CARD", "CASH", "UPI", "CREDIT_CARD", "DEBIT_CARD")

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
          val vehicleRec = updatedVehicles.get(rand.nextInt(updatedVehicles.size()))
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

    val demoPairs = List(
      (adminVehicleId, availableSpaceList(0)),
      (customerVehicleId, availableSpaceList(1))
    )

    demoPairs.foreach { case (vehId, spaceRec) =>
      val spaceId = UUID.fromString(spaceRec.get("id").toString)
      val sessionId = UUID.randomUUID()
      val entryTime = now.minusMinutes(30 + rand.nextInt(45)).toInstant

      dslContext.execute(
        """INSERT INTO parking_sessions (id, vehicle_id, space_id, entry_time, exit_time, duration_minutes, fee)
          |VALUES (?::uuid, ?::uuid, ?::uuid, ?::timestamptz, NULL, NULL, NULL)
          |ON CONFLICT (id) DO NOTHING""".stripMargin,
        sessionId, vehId, spaceId, entryTime.toString
      )

      dslContext.execute(
        "UPDATE parking_spaces SET status = 'OCCUPIED' WHERE id = ?::uuid",
        spaceId
      )
    }

    val additionalActiveCount = Math.min(8, availableSpaceList.size - 2)
    for (i <- 2 until (2 + additionalActiveCount)) {
      val spaceRec = availableSpaceList(i)
      val vehicleRec = updatedVehicles.get(i % updatedVehicles.size())
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

    val demoResTargets = List(
      (adminUserId, availableSpaceList(availableSpaceList.size - 1)),
      (customerUserId, availableSpaceList(availableSpaceList.size - 2))
    )

    demoResTargets.foreach { case (uId, spaceRec) =>
      val spaceId = UUID.fromString(spaceRec.get("id").toString)
      val resId = UUID.randomUUID()
      val startTime = now.minusMinutes(10).toInstant
      val endTime = now.plusHours(3).toInstant
      val fee = BigDecimal.valueOf(180.00)

      dslContext.execute(
        """INSERT INTO reservations (id, user_id, space_id, start_time, end_time, status, fee)
          |VALUES (?::uuid, ?::uuid, ?::uuid, ?::timestamptz, ?::timestamptz, 'CONFIRMED', ?)
          |ON CONFLICT (id) DO NOTHING""".stripMargin,
        resId, uId, spaceId, startTime.toString, endTime.toString, fee
      )

      dslContext.execute(
        "UPDATE parking_spaces SET status = 'RESERVED' WHERE id = ?::uuid",
        spaceId
      )
    }

    if (!usersList.isEmpty) {
      val statuses = Array("CONFIRMED", "COMPLETED", "PENDING", "CANCELLED")
      for (dayOffset <- (0 to 14).reverse) {
        val dayDate = now.minusDays(dayOffset)
        val countForDay = 2 + rand.nextInt(3)

        for (_ <- 1 to countForDay) {
          val startHour = 8 + rand.nextInt(10)
          val durationHours = 1 + rand.nextInt(4)
          val startTime = dayDate.withHour(startHour).withMinute(0).withSecond(0).toInstant
          val endTime = startTime.plusSeconds(durationHours * 3600)
          val userRec = usersList.get(rand.nextInt(usersList.size()))
          val spaceRec = spaces.get(rand.nextInt(spaces.size()))
          val userId = UUID.fromString(userRec.get("id").toString)
          val spaceId = UUID.fromString(spaceRec.get("id").toString)
          val resId = UUID.randomUUID()
          val hourlyRate = 40.0 + (rand.nextInt(5) * 10.0)
          val fee = BigDecimal.valueOf(durationHours * hourlyRate)

          val status = if (endTime.isBefore(now.toInstant)) "COMPLETED"
                       else if (startTime.isBefore(now.toInstant) && endTime.isAfter(now.toInstant)) "CONFIRMED"
                       else statuses(rand.nextInt(statuses.length))

          dslContext.execute(
            """INSERT INTO reservations (id, user_id, space_id, start_time, end_time, status, fee)
              |VALUES (?::uuid, ?::uuid, ?::uuid, ?::timestamptz, ?::timestamptz, ?, ?)
              |ON CONFLICT (id) DO NOTHING""".stripMargin,
            resId, userId, spaceId, startTime.toString, endTime.toString, status, fee
          )
        }
      }
    }

    logger.info("Dynamic current-time comprehensive auto-seeder finished successfully for today ({})!", now.toLocalDate)
  }
}
