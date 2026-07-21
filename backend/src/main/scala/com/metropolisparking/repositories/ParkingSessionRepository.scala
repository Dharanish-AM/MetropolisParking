package com.metropolisparking.repositories

import com.metropolisparking.jooq.Tables.PARKING_SESSIONS
import com.metropolisparking.models.ParkingSession
import org.jooq.DSLContext
import java.time.{OffsetDateTime, ZoneOffset}
import java.util.UUID
import scala.jdk.CollectionConverters._

class ParkingSessionRepository(dsl: DSLContext) extends BaseRepository(dsl) {
  def create(session: ParkingSession): ParkingSession = {
    dsl.insertInto(PARKING_SESSIONS)
      .set(PARKING_SESSIONS.ID, session.id)
      .set(PARKING_SESSIONS.VEHICLE_ID, session.vehicleId)
      .set(PARKING_SESSIONS.SPACE_ID, session.spaceId)
      .set(PARKING_SESSIONS.ENTRY_TIME, OffsetDateTime.ofInstant(session.entryTime, ZoneOffset.UTC))
      .execute()
    session
  }

  def findActiveByVehicleId(vehicleId: UUID): Option[ParkingSession] = {
    Option(
      dsl.selectFrom(PARKING_SESSIONS)
        .where(PARKING_SESSIONS.VEHICLE_ID.eq(vehicleId).and(PARKING_SESSIONS.EXIT_TIME.isNull))
        .fetchOne()
    ).map(mapRecord)
  }

  def findActiveBySpaceId(spaceId: UUID): Option[ParkingSession] = {
    Option(
      dsl.selectFrom(PARKING_SESSIONS)
        .where(PARKING_SESSIONS.SPACE_ID.eq(spaceId).and(PARKING_SESSIONS.EXIT_TIME.isNull))
        .fetchOne()
    ).map(mapRecord)
  }

  def findById(id: UUID): Option[ParkingSession] = {
    Option(
      dsl.selectFrom(PARKING_SESSIONS)
        .where(PARKING_SESSIONS.ID.eq(id))
        .fetchOne()
    ).map(mapRecord)
  }

  def update(session: ParkingSession): ParkingSession = {
    dsl.update(PARKING_SESSIONS)
      .set(PARKING_SESSIONS.EXIT_TIME, session.exitTime.map(t => OffsetDateTime.ofInstant(t, ZoneOffset.UTC)).orNull)
      .set(PARKING_SESSIONS.DURATION_MINUTES, session.durationMinutes.map(java.lang.Integer.valueOf).orNull)
      .set(PARKING_SESSIONS.FEE, session.fee.map(_.bigDecimal).orNull)
      .set(PARKING_SESSIONS.UPDATED_AT, OffsetDateTime.now())
      .where(PARKING_SESSIONS.ID.eq(session.id))
      .execute()
    session
  }

  def list(activeOnly: Boolean): List[ParkingSession] = {
    val query = dsl.selectFrom(PARKING_SESSIONS)
    val step = if (activeOnly) {
      query.where(PARKING_SESSIONS.EXIT_TIME.isNull)
    } else {
      query
    }
    step.orderBy(PARKING_SESSIONS.ENTRY_TIME.desc())
      .fetch().asScala.map(mapRecord).toList
  }

  def listByVehicleId(vehicleId: UUID): List[ParkingSession] = {
    dsl.selectFrom(PARKING_SESSIONS)
      .where(PARKING_SESSIONS.VEHICLE_ID.eq(vehicleId))
      .orderBy(PARKING_SESSIONS.ENTRY_TIME.desc())
      .fetch().asScala.map(mapRecord).toList
  }

  private def mapRecord(r: com.metropolisparking.jooq.tables.records.ParkingSessionsRecord): ParkingSession = {
    ParkingSession(
      id = r.getId,
      vehicleId = r.getVehicleId,
      spaceId = r.getSpaceId,
      entryTime = r.getEntryTime.toInstant,
      exitTime = Option(r.getExitTime).map(_.toInstant),
      durationMinutes = Option(r.getDurationMinutes).map(_.intValue()),
      fee = Option(r.getFee).map(BigDecimal(_))
    )
  }
}
