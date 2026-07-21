package com.metropolisparking.repositories

import com.metropolisparking.jooq.Tables.{PARKING_LOTS, PARKING_LEVELS, PARKING_SPACES}
import com.metropolisparking.models.{ParkingLot, ParkingLevel, ParkingSpace}
import org.jooq.DSLContext
import java.time.OffsetDateTime
import java.util.UUID
import scala.jdk.CollectionConverters._

class ParkingLotRepository(dsl: DSLContext) extends BaseRepository(dsl) {
  def create(lot: ParkingLot): ParkingLot = {
    dsl.insertInto(PARKING_LOTS)
      .set(PARKING_LOTS.ID, lot.id)
      .set(PARKING_LOTS.NAME, lot.name)
      .set(PARKING_LOTS.LOCATION, lot.location)
      .execute()
    lot
  }

  def list(): List[ParkingLot] = {
    dsl.selectFrom(PARKING_LOTS)
      .where(PARKING_LOTS.DELETED_AT.isNull)
      .fetch().asScala.map { r =>
        ParkingLot(r.getId, r.getName, r.getLocation)
      }.toList
  }

  def findById(id: UUID): Option[ParkingLot] = {
    Option(
      dsl.selectFrom(PARKING_LOTS)
        .where(PARKING_LOTS.ID.eq(id).and(PARKING_LOTS.DELETED_AT.isNull))
        .fetchOne()
    ).map(r => ParkingLot(r.getId, r.getName, r.getLocation))
  }

  def update(lot: ParkingLot): ParkingLot = {
    dsl.update(PARKING_LOTS)
      .set(PARKING_LOTS.NAME, lot.name)
      .set(PARKING_LOTS.LOCATION, lot.location)
      .set(PARKING_LOTS.UPDATED_AT, OffsetDateTime.now())
      .where(PARKING_LOTS.ID.eq(lot.id))
      .execute()
    lot
  }

  def delete(id: UUID): Boolean = {
    dsl.update(PARKING_LOTS)
      .set(PARKING_LOTS.DELETED_AT, OffsetDateTime.now())
      .where(PARKING_LOTS.ID.eq(id))
      .execute() > 0
  }

  def createLevel(level: ParkingLevel): ParkingLevel = {
    dsl.insertInto(PARKING_LEVELS)
      .set(PARKING_LEVELS.ID, level.id)
      .set(PARKING_LEVELS.LOT_ID, level.lotId)
      .set(PARKING_LEVELS.LEVEL_NUMBER, java.lang.Integer.valueOf(level.levelNumber))
      .execute()
    level
  }

  def listLevels(lotId: UUID): List[ParkingLevel] = {
    dsl.selectFrom(PARKING_LEVELS)
      .where(PARKING_LEVELS.LOT_ID.eq(lotId))
      .fetch().asScala.map { r =>
        ParkingLevel(r.getId, r.getLotId, r.getLevelNumber.intValue())
      }.toList
  }

  def findLevel(lotId: UUID, levelNumber: Int): Option[ParkingLevel] = {
    Option(
      dsl.selectFrom(PARKING_LEVELS)
        .where(PARKING_LEVELS.LOT_ID.eq(lotId).and(PARKING_LEVELS.LEVEL_NUMBER.eq(java.lang.Integer.valueOf(levelNumber))))
        .fetchOne()
    ).map(r => ParkingLevel(r.getId, r.getLotId, r.getLevelNumber.intValue()))
  }

  def createSpace(space: ParkingSpace): ParkingSpace = {
    dsl.insertInto(PARKING_SPACES)
      .set(PARKING_SPACES.ID, space.id)
      .set(PARKING_SPACES.LOT_ID, space.lotId)
      .set(PARKING_SPACES.LEVEL_ID, space.levelId)
      .set(PARKING_SPACES.SPACE_NUMBER, space.spaceNumber)
      .set(PARKING_SPACES.TYPE, space.`type`)
      .set(PARKING_SPACES.STATUS, space.status)
      .execute()
    space
  }

  def listSpaces(lotId: Option[UUID], levelId: Option[UUID]): List[ParkingSpace] = {
    var query = dsl.selectFrom(PARKING_SPACES).where(PARKING_SPACES.DELETED_AT.isNull)
    lotId.foreach(lid => query = query.and(PARKING_SPACES.LOT_ID.eq(lid)))
    levelId.foreach(lid => query = query.and(PARKING_SPACES.LEVEL_ID.eq(lid)))
    query.fetch().asScala.map { r =>
      ParkingSpace(r.getId, r.getLotId, r.getLevelId, r.getSpaceNumber, r.getType, r.getStatus)
    }.toList
  }

  def findSpaceById(id: UUID): Option[ParkingSpace] = {
    Option(
      dsl.selectFrom(PARKING_SPACES)
        .where(PARKING_SPACES.ID.eq(id).and(PARKING_SPACES.DELETED_AT.isNull))
        .fetchOne()
    ).map(r => ParkingSpace(r.getId, r.getLotId, r.getLevelId, r.getSpaceNumber, r.getType, r.getStatus))
  }

  def updateSpace(space: ParkingSpace): ParkingSpace = {
    dsl.update(PARKING_SPACES)
      .set(PARKING_SPACES.STATUS, space.status)
      .set(PARKING_SPACES.SPACE_NUMBER, space.spaceNumber)
      .set(PARKING_SPACES.TYPE, space.`type`)
      .set(PARKING_SPACES.UPDATED_AT, OffsetDateTime.now())
      .where(PARKING_SPACES.ID.eq(space.id))
      .execute()
    space
  }

  def deleteSpace(id: UUID): Boolean = {
    dsl.update(PARKING_SPACES)
      .set(PARKING_SPACES.DELETED_AT, OffsetDateTime.now())
      .where(PARKING_SPACES.ID.eq(id))
      .execute() > 0
  }
}
