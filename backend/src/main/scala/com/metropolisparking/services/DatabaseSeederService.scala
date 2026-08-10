package com.metropolisparking.services

import com.metropolisparking.jooq.Tables.{PARKING_SESSIONS, PAYMENTS, RESERVATIONS, VEHICLES, PARKING_SPACES, USERS}
import org.jooq.DSLContext
import org.slf4j.LoggerFactory
import java.math.BigDecimal
import java.time.{OffsetDateTime, ZoneId, ZoneOffset, ZonedDateTime, LocalDate}
import java.util.UUID
import scala.util.Random
import scala.jdk.CollectionConverters._

class DatabaseSeederService(dslContext: DSLContext) {
  private val logger = LoggerFactory.getLogger(getClass)
  private val rand = new Random(42)

  def ensureSeeded(): Unit = {
    try {
      val today = LocalDate.now(ZoneId.of("Asia/Kolkata"))
      val activeSessionCount = dslContext.selectCount()
        .from(PARKING_SESSIONS)
        .where(PARKING_SESSIONS.EXIT_TIME.isNull)
        .fetchOne(0, classOf[java.lang.Integer])

      val activeResCount = dslContext.selectCount()
        .from(RESERVATIONS)
        .where(RESERVATIONS.STATUS.in("CONFIRMED", "PENDING"))
        .fetchOne(0, classOf[java.lang.Integer])

      if (activeSessionCount == null || activeSessionCount < 3 || activeResCount == null || activeResCount < 3) {
        logger.info("Database seed check triggered - executing dynamic comprehensive auto-seed...", today)
        seedDynamicData()
      } else {
        logger.info("Database already fully seeded with {} active sessions and {} active reservations ({})", activeSessionCount, activeResCount, today)
      }

      ensureActiveUserPasses()
    } catch {
      case ex: Throwable =>
        logger.error("Error during dynamic auto-seed check", ex)
    }
  }

  def ensureActiveUserPasses(): Unit = {
    val zone = ZoneId.of("Asia/Kolkata")
    val now = ZonedDateTime.now(zone)

    val usersList = dslContext.select(USERS.ID, USERS.EMAIL, USERS.ROLE_ID).from(USERS).fetch()
    val spaces = dslContext.select(PARKING_SPACES.ID, PARKING_SPACES.SPACE_NUMBER, PARKING_SPACES.LOT_ID)
      .from(PARKING_SPACES)
      .where(PARKING_SPACES.STATUS.ne("OUT_OF_SERVICE"))
      .fetch()

    if (usersList.isEmpty || spaces.isEmpty) return

    val adminUserRec = usersList.asScala.find(r => Option(r.get(USERS.EMAIL)).map(_.toLowerCase).contains("admin@metropolisparking.com"))
    val customerUserRec = usersList.asScala.find(r => Option(r.get(USERS.EMAIL)).map(_.toLowerCase).contains("customer@metropolisparking.com"))

    val targetUsers = List(adminUserRec, customerUserRec).flatten

    targetUsers.foreach { userRec =>
      val userId = userRec.get(USERS.ID)
      val email = userRec.get(USERS.EMAIL)

      val plate = if (email.contains("admin")) "MH01AD8888" else "KA01CS9999"
      val vehType = if (email.contains("admin")) "CAR" else "SUV"

      val existingVeh = dslContext.selectFrom(VEHICLES).where(VEHICLES.PLATE_NUMBER.eq(plate)).fetchOne()
      val actualVehId = if (existingVeh != null) {
        existingVeh.getId
      } else {
        val newVehId = UUID.randomUUID()
        dslContext.insertInto(VEHICLES)
          .set(VEHICLES.ID, newVehId)
          .set(VEHICLES.PLATE_NUMBER, plate)
          .set(VEHICLES.TYPE, vehType)
          .set(VEHICLES.OWNER_ID, userId)
          .execute()
        newVehId
      }

      val hasActiveSession = dslContext.fetchExists(
        dslContext.selectOne()
          .from(PARKING_SESSIONS)
          .join(VEHICLES).on(PARKING_SESSIONS.VEHICLE_ID.eq(VEHICLES.ID))
          .where(VEHICLES.OWNER_ID.eq(userId).and(PARKING_SESSIONS.EXIT_TIME.isNull))
      )

      if (!hasActiveSession) {
        val spaceRec = spaces.get(rand.nextInt(spaces.size()))
        val spaceId = spaceRec.get(PARKING_SPACES.ID)
        val sessionId = UUID.randomUUID()
        val entryTime = now.minusMinutes(45).toInstant

        dslContext.insertInto(PARKING_SESSIONS)
          .set(PARKING_SESSIONS.ID, sessionId)
          .set(PARKING_SESSIONS.VEHICLE_ID, actualVehId)
          .set(PARKING_SESSIONS.SPACE_ID, spaceId)
          .set(PARKING_SESSIONS.ENTRY_TIME, OffsetDateTime.ofInstant(entryTime, ZoneOffset.UTC))
          .execute()

        dslContext.update(PARKING_SPACES)
          .set(PARKING_SPACES.STATUS, "OCCUPIED")
          .where(PARKING_SPACES.ID.eq(spaceId))
          .execute()
      }

      val hasActiveRes = dslContext.fetchExists(
        dslContext.selectOne()
          .from(RESERVATIONS)
          .where(RESERVATIONS.USER_ID.eq(userId)
            .and(RESERVATIONS.STATUS.in("CONFIRMED", "PENDING"))
            .and(RESERVATIONS.END_TIME.gt(OffsetDateTime.ofInstant(now.toInstant, ZoneOffset.UTC))))
      )

      if (!hasActiveRes) {
        val spaceRec = spaces.get(rand.nextInt(spaces.size()))
        val spaceId = spaceRec.get(PARKING_SPACES.ID)
        val resId = UUID.randomUUID()
        val startTime = now.minusMinutes(10).toInstant
        val endTime = now.plusHours(3).toInstant
        val fee = BigDecimal.valueOf(180.00)

        dslContext.insertInto(RESERVATIONS)
          .set(RESERVATIONS.ID, resId)
          .set(RESERVATIONS.USER_ID, userId)
          .set(RESERVATIONS.SPACE_ID, spaceId)
          .set(RESERVATIONS.START_TIME, OffsetDateTime.ofInstant(startTime, ZoneOffset.UTC))
          .set(RESERVATIONS.END_TIME, OffsetDateTime.ofInstant(endTime, ZoneOffset.UTC))
          .set(RESERVATIONS.STATUS, "CONFIRMED")
          .set(RESERVATIONS.FEE, fee)
          .execute()

        dslContext.update(PARKING_SPACES)
          .set(PARKING_SPACES.STATUS, "RESERVED")
          .where(PARKING_SPACES.ID.eq(spaceId))
          .execute()
      }
    }
  }

  def seedDynamicData(): Unit = {
    val zone = ZoneId.of("Asia/Kolkata")
    val now = ZonedDateTime.now(zone)

    val spaces = dslContext.select(PARKING_SPACES.ID, PARKING_SPACES.SPACE_NUMBER, PARKING_SPACES.LOT_ID).from(PARKING_SPACES).fetch()
    val usersList = dslContext.select(USERS.ID, USERS.EMAIL, USERS.ROLE_ID).from(USERS).fetch()

    if (spaces.isEmpty) {
      logger.warn("Missing core master data (parking spaces). Skipping dynamic seeding.")
      return
    }

    val fallbackUserId = usersList.asScala.headOption.map(_.get(USERS.ID)).getOrElse(UUID.randomUUID())

    val adminUserRec = usersList.asScala.find(r => Option(r.get(USERS.EMAIL)).map(_.toLowerCase).contains("admin@metropolisparking.com"))
    val customerUserRec = usersList.asScala.find(r => Option(r.get(USERS.EMAIL)).map(_.toLowerCase).contains("customer@metropolisparking.com"))

    val adminUserId = adminUserRec.map(_.get(USERS.ID)).getOrElse(fallbackUserId)
    val customerUserId = customerUserRec.map(_.get(USERS.ID)).getOrElse(fallbackUserId)

    val existingAdminVeh = dslContext.selectFrom(VEHICLES).where(VEHICLES.PLATE_NUMBER.eq("MH01AD8888")).fetchOne()
    val adminVehicleId = if (existingAdminVeh != null) {
      existingAdminVeh.getId
    } else {
      val vId = UUID.randomUUID()
      dslContext.insertInto(VEHICLES)
        .set(VEHICLES.ID, vId)
        .set(VEHICLES.PLATE_NUMBER, "MH01AD8888")
        .set(VEHICLES.TYPE, "CAR")
        .set(VEHICLES.OWNER_ID, adminUserId)
        .execute()
      vId
    }

    val existingCustVeh = dslContext.selectFrom(VEHICLES).where(VEHICLES.PLATE_NUMBER.eq("KA01CS9999")).fetchOne()
    val customerVehicleId = if (existingCustVeh != null) {
      existingCustVeh.getId
    } else {
      val vId = UUID.randomUUID()
      dslContext.insertInto(VEHICLES)
        .set(VEHICLES.ID, vId)
        .set(VEHICLES.PLATE_NUMBER, "KA01CS9999")
        .set(VEHICLES.TYPE, "SUV")
        .set(VEHICLES.OWNER_ID, customerUserId)
        .execute()
      vId
    }

    val updatedVehicles = dslContext.select(VEHICLES.ID, VEHICLES.PLATE_NUMBER, VEHICLES.TYPE, VEHICLES.OWNER_ID).from(VEHICLES).fetch()
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
          val spaceId = spaceRec.get(PARKING_SPACES.ID)
          val vehicleId = vehicleRec.get(VEHICLES.ID)
          val sessionId = UUID.randomUUID()
          val paymentId = UUID.randomUUID()

          val hourlyRate = 30.0 + (rand.nextInt(6) * 10.0)
          val hours = Math.max(1, Math.ceil(durationMins / 60.0).toInt)
          val fee = BigDecimal.valueOf(hours * hourlyRate)
          val method = methods(rand.nextInt(methods.length))

          dslContext.insertInto(PARKING_SESSIONS)
            .set(PARKING_SESSIONS.ID, sessionId)
            .set(PARKING_SESSIONS.VEHICLE_ID, vehicleId)
            .set(PARKING_SESSIONS.SPACE_ID, spaceId)
            .set(PARKING_SESSIONS.ENTRY_TIME, OffsetDateTime.ofInstant(entryTime, ZoneOffset.UTC))
            .set(PARKING_SESSIONS.EXIT_TIME, OffsetDateTime.ofInstant(exitTime, ZoneOffset.UTC))
            .set(PARKING_SESSIONS.DURATION_MINUTES, java.lang.Integer.valueOf(durationMins))
            .set(PARKING_SESSIONS.FEE, fee)
            .execute()

          dslContext.insertInto(PAYMENTS)
            .set(PAYMENTS.ID, paymentId)
            .set(PAYMENTS.SESSION_ID, sessionId)
            .set(PAYMENTS.AMOUNT, fee)
            .set(PAYMENTS.METHOD, method)
            .set(PAYMENTS.STATUS, "SETTLED")
            .set(PAYMENTS.CREATED_AT, OffsetDateTime.ofInstant(exitTime, ZoneOffset.UTC))
            .execute()
        }
      }
    }

    val availableSpaceList = spaces.asScala.toList

    val demoPairs = List(
      (adminVehicleId, availableSpaceList(0)),
      (customerVehicleId, availableSpaceList(1))
    )

    demoPairs.foreach { case (vehId, spaceRec) =>
      val spaceId = spaceRec.get(PARKING_SPACES.ID)
      val sessionId = UUID.randomUUID()
      val entryTime = now.minusMinutes(30 + rand.nextInt(45)).toInstant

      dslContext.insertInto(PARKING_SESSIONS)
        .set(PARKING_SESSIONS.ID, sessionId)
        .set(PARKING_SESSIONS.VEHICLE_ID, vehId)
        .set(PARKING_SESSIONS.SPACE_ID, spaceId)
        .set(PARKING_SESSIONS.ENTRY_TIME, OffsetDateTime.ofInstant(entryTime, ZoneOffset.UTC))
        .execute()

      dslContext.update(PARKING_SPACES)
        .set(PARKING_SPACES.STATUS, "OCCUPIED")
        .where(PARKING_SPACES.ID.eq(spaceId))
        .execute()
    }

    val additionalActiveCount = Math.min(8, availableSpaceList.size - 2)
    for (i <- 2 until (2 + additionalActiveCount)) {
      val spaceRec = availableSpaceList(i)
      val vehicleRec = updatedVehicles.get(i % updatedVehicles.size())
      val spaceId = spaceRec.get(PARKING_SPACES.ID)
      val vehicleId = vehicleRec.get(VEHICLES.ID)
      val sessionId = UUID.randomUUID()
      val entryTime = now.minusMinutes(15 + rand.nextInt(90)).toInstant

      dslContext.insertInto(PARKING_SESSIONS)
        .set(PARKING_SESSIONS.ID, sessionId)
        .set(PARKING_SESSIONS.VEHICLE_ID, vehicleId)
        .set(PARKING_SESSIONS.SPACE_ID, spaceId)
        .set(PARKING_SESSIONS.ENTRY_TIME, OffsetDateTime.ofInstant(entryTime, ZoneOffset.UTC))
        .execute()

      dslContext.update(PARKING_SPACES)
        .set(PARKING_SPACES.STATUS, "OCCUPIED")
        .where(PARKING_SPACES.ID.eq(spaceId))
        .execute()
    }

    val demoResTargets = List(
      (adminUserId, availableSpaceList(availableSpaceList.size - 1)),
      (customerUserId, availableSpaceList(availableSpaceList.size - 2))
    )

    demoResTargets.foreach { case (uId, spaceRec) =>
      val spaceId = spaceRec.get(PARKING_SPACES.ID)
      val resId = UUID.randomUUID()
      val startTime = now.minusMinutes(10).toInstant
      val endTime = now.plusHours(3).toInstant
      val fee = BigDecimal.valueOf(180.00)

      dslContext.insertInto(RESERVATIONS)
        .set(RESERVATIONS.ID, resId)
        .set(RESERVATIONS.USER_ID, uId)
        .set(RESERVATIONS.SPACE_ID, spaceId)
        .set(RESERVATIONS.START_TIME, OffsetDateTime.ofInstant(startTime, ZoneOffset.UTC))
        .set(RESERVATIONS.END_TIME, OffsetDateTime.ofInstant(endTime, ZoneOffset.UTC))
        .set(RESERVATIONS.STATUS, "CONFIRMED")
        .set(RESERVATIONS.FEE, fee)
        .execute()

      dslContext.update(PARKING_SPACES)
        .set(PARKING_SPACES.STATUS, "RESERVED")
        .where(PARKING_SPACES.ID.eq(spaceId))
        .execute()
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
          val userId = userRec.get(USERS.ID)
          val spaceId = spaceRec.get(PARKING_SPACES.ID)
          val resId = UUID.randomUUID()
          val hourlyRate = 40.0 + (rand.nextInt(5) * 10.0)
          val fee = BigDecimal.valueOf(durationHours * hourlyRate)

          val status = if (endTime.isBefore(now.toInstant)) "COMPLETED"
                       else if (startTime.isBefore(now.toInstant) && endTime.isAfter(now.toInstant)) "CONFIRMED"
                       else statuses(rand.nextInt(statuses.length))

          dslContext.insertInto(RESERVATIONS)
            .set(RESERVATIONS.ID, resId)
            .set(RESERVATIONS.USER_ID, userId)
            .set(RESERVATIONS.SPACE_ID, spaceId)
            .set(RESERVATIONS.START_TIME, OffsetDateTime.ofInstant(startTime, ZoneOffset.UTC))
            .set(RESERVATIONS.END_TIME, OffsetDateTime.ofInstant(endTime, ZoneOffset.UTC))
            .set(RESERVATIONS.STATUS, status)
            .set(RESERVATIONS.FEE, fee)
            .execute()
        }
      }
    }

    logger.info("Dynamic current-time comprehensive auto-seeder finished successfully for today ({})!", now.toLocalDate)
  }
}
