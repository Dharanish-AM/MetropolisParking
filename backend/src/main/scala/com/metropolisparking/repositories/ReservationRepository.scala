package com.metropolisparking.repositories

import com.metropolisparking.jooq.Tables.RESERVATIONS
import com.metropolisparking.models.Reservation
import org.jooq.DSLContext
import java.time.{Instant, OffsetDateTime, ZoneOffset}
import java.util.UUID
import scala.jdk.CollectionConverters._

class ReservationRepository(dsl: DSLContext) extends BaseRepository(dsl) {
  def create(res: Reservation): Reservation = {
    dsl.insertInto(RESERVATIONS)
      .set(RESERVATIONS.ID, res.id)
      .set(RESERVATIONS.USER_ID, res.userId)
      .set(RESERVATIONS.SPACE_ID, res.spaceId)
      .set(RESERVATIONS.START_TIME, OffsetDateTime.ofInstant(res.startTime, ZoneOffset.UTC))
      .set(RESERVATIONS.END_TIME, OffsetDateTime.ofInstant(res.endTime, ZoneOffset.UTC))
      .set(RESERVATIONS.STATUS, res.status)
      .set(RESERVATIONS.FEE, res.fee.bigDecimal)
      .set(RESERVATIONS.CREATED_AT, OffsetDateTime.ofInstant(res.createdAt, ZoneOffset.UTC))
      .set(RESERVATIONS.UPDATED_AT, OffsetDateTime.ofInstant(res.updatedAt, ZoneOffset.UTC))
      .execute()
    res
  }

  def update(res: Reservation): Unit = {
    dsl.update(RESERVATIONS)
      .set(RESERVATIONS.STATUS, res.status)
      .set(RESERVATIONS.UPDATED_AT, OffsetDateTime.ofInstant(Instant.now(), ZoneOffset.UTC))
      .where(RESERVATIONS.ID.eq(res.id))
      .execute()
  }

  def findById(id: UUID): Option[Reservation] = {
    Option(
      dsl.selectFrom(RESERVATIONS)
        .where(RESERVATIONS.ID.eq(id))
        .fetchOne()
    ).map(mapRecord)
  }

  def listAll(): List[Reservation] = {
    dsl.selectFrom(RESERVATIONS)
      .orderBy(RESERVATIONS.START_TIME.desc())
      .fetch().asScala.map(mapRecord).toList
  }

  def listByUserId(userId: UUID): List[Reservation] = {
    dsl.selectFrom(RESERVATIONS)
      .where(RESERVATIONS.USER_ID.eq(userId))
      .orderBy(RESERVATIONS.START_TIME.desc())
      .fetch().asScala.map(mapRecord).toList
  }

  def hasOverlapping(spaceId: UUID, startTime: Instant, endTime: Instant): Boolean = {
    val start = OffsetDateTime.ofInstant(startTime, ZoneOffset.UTC)
    val end = OffsetDateTime.ofInstant(endTime, ZoneOffset.UTC)
    dsl.fetchExists(
      dsl.select(RESERVATIONS.ID)
        .from(RESERVATIONS)
        .where(RESERVATIONS.SPACE_ID.eq(spaceId))
        .and(RESERVATIONS.STATUS.in("CONFIRMED", "PENDING"))
        .and(RESERVATIONS.START_TIME.lt(end))
        .and(RESERVATIONS.END_TIME.gt(start))
    )
  }

  private def mapRecord(r: com.metropolisparking.jooq.tables.records.ReservationsRecord): Reservation = {
    Reservation(
      id = r.getId,
      userId = r.getUserId,
      spaceId = r.getSpaceId,
      startTime = r.getStartTime.toInstant,
      endTime = r.getEndTime.toInstant,
      status = r.getStatus,
      fee = BigDecimal(r.getFee.toString),
      createdAt = r.getCreatedAt.toInstant,
      updatedAt = r.getUpdatedAt.toInstant
    )
  }
}
