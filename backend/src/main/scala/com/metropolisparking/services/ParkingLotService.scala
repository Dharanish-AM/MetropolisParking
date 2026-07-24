package com.metropolisparking.services

import com.metropolisparking.dto.{ParkingLotCreateRequest, ParkingSpaceCreateRequest}
import com.metropolisparking.exceptions.{ConflictException, NotFoundException}
import com.metropolisparking.models.{ParkingLevel, ParkingLot, ParkingSpace}
import com.metropolisparking.repositories.ParkingLotRepository
import com.metropolisparking.validation.Validator
import java.util.UUID

class ParkingLotService(
  repo: ParkingLotRepository,
  auditLogService: AuditLogService,
  wsService: WebSocketService = null
) {
  private def broadcast(eventJson: String): Unit = Option(wsService).foreach(_.broadcast(eventJson))
  def createLot(req: ParkingLotCreateRequest, userId: Option[UUID]): ParkingLot = {
    Validator.validateLength(req.name, 2, 100, "name")
    Validator.validateLength(req.location, 2, 255, "location")

    val lot = ParkingLot(UUID.randomUUID(), req.name, req.location)
    repo.create(lot)
    auditLogService.logAction(userId, "PARKING_LOT_CREATED", "parking_lots", Some(lot.id), Some(s"Created lot: ${lot.name}"))
    lot
  }

  def listLots(): List[ParkingLot] = repo.list()

  def getLot(id: UUID): Option[ParkingLot] = repo.findById(id)

  def updateLot(id: UUID, req: ParkingLotCreateRequest, userId: Option[UUID]): ParkingLot = {
    val existing = repo.findById(id).getOrElse(throw NotFoundException(s"Parking lot '$id' not found"))
    Validator.validateLength(req.name, 2, 100, "name")
    Validator.validateLength(req.location, 2, 255, "location")

    val updated = existing.copy(name = req.name, location = req.location)
    repo.update(updated)
    auditLogService.logAction(userId, "PARKING_LOT_UPDATED", "parking_lots", Some(id), Some(s"Updated lot: ${updated.name}"))
    updated
  }

  def deleteLot(id: UUID, userId: Option[UUID]): Boolean = {
    repo.findById(id).getOrElse(throw NotFoundException(s"Parking lot '$id' not found"))
    val deleted = repo.delete(id)
    if (deleted) {
      auditLogService.logAction(userId, "PARKING_LOT_DELETED", "parking_lots", Some(id), Some(s"Deleted lot ID: $id"))
    }
    deleted
  }

  def createLevel(lotId: UUID, levelNumber: Int, userId: Option[UUID]): ParkingLevel = {
    repo.findById(lotId).getOrElse(throw NotFoundException(s"Parking lot '$lotId' not found"))
    Validator.validateRange(levelNumber, -10, 100, "levelNumber")

    repo.findLevel(lotId, levelNumber).foreach { _ =>
      throw ConflictException(s"Parking level '$levelNumber' already exists for lot '$lotId'")
    }

    val level = ParkingLevel(UUID.randomUUID(), lotId, levelNumber)
    repo.createLevel(level)
    auditLogService.logAction(userId, "PARKING_LEVEL_CREATED", "parking_levels", Some(level.id), Some(s"Created level $levelNumber for lot $lotId"))
    level
  }

  def listLevels(lotId: UUID): List[ParkingLevel] = {
    repo.findById(lotId).getOrElse(throw NotFoundException(s"Parking lot '$lotId' not found"))
    repo.listLevels(lotId)
  }

  def createSpace(req: ParkingSpaceCreateRequest, userId: Option[UUID]): ParkingSpace = {
    repo.findById(req.lotId).getOrElse(throw NotFoundException(s"Parking lot '${req.lotId}' not found"))
    val levels = repo.listLevels(req.lotId)
    if (!levels.exists(_.id == req.levelId)) {
      throw NotFoundException(s"Parking level '${req.levelId}' not found for lot '${req.lotId}'")
    }

    Validator.validateLength(req.spaceNumber, 1, 50, "spaceNumber")
    Validator.validateEnum(req.`type`.toUpperCase, Set("CAR", "BIKE", "SUV", "TRUCK", "EV"), "type")

    val existingSpaces = repo.listSpaces(Some(req.lotId), Some(req.levelId))
    if (existingSpaces.exists(_.spaceNumber.equalsIgnoreCase(req.spaceNumber))) {
      throw ConflictException(s"Space number '${req.spaceNumber}' already exists on level '${req.levelId}'")
    }

    val space = ParkingSpace(
      id = UUID.randomUUID(),
      lotId = req.lotId,
      levelId = req.levelId,
      spaceNumber = req.spaceNumber.toUpperCase,
      `type` = req.`type`.toUpperCase,
      status = "AVAILABLE"
    )
    repo.createSpace(space)
    auditLogService.logAction(userId, "PARKING_SPACE_CREATED", "parking_spaces", Some(space.id), Some(s"Created space ${space.spaceNumber} on level ${space.levelId}"))
    broadcast(s"""{"event":"space_updated","spaceId":"${space.id}","status":"AVAILABLE"}""")
    broadcast("""{"event":"dashboard_updated"}""")
    space
  }

  def listSpaces(lotId: Option[UUID], levelId: Option[UUID]): List[ParkingSpace] = {
    repo.listSpaces(lotId, levelId)
  }

  def getSpace(id: UUID): Option[ParkingSpace] = repo.findSpaceById(id)

  def updateSpace(id: UUID, req: ParkingSpaceCreateRequest, userId: Option[UUID]): ParkingSpace = {
    val existing = repo.findSpaceById(id).getOrElse(throw NotFoundException(s"Parking space '$id' not found"))
    Validator.validateLength(req.spaceNumber, 1, 50, "spaceNumber")
    Validator.validateEnum(req.`type`.toUpperCase, Set("CAR", "BIKE", "SUV", "TRUCK", "EV"), "type")

    if (!existing.spaceNumber.equalsIgnoreCase(req.spaceNumber)) {
      val existingSpaces = repo.listSpaces(Some(req.lotId), Some(req.levelId))
      if (existingSpaces.exists(_.spaceNumber.equalsIgnoreCase(req.spaceNumber))) {
        throw ConflictException(s"Space number '${req.spaceNumber}' already exists on level '${req.levelId}'")
      }
    }

    val updated = existing.copy(spaceNumber = req.spaceNumber.toUpperCase, `type` = req.`type`.toUpperCase)
    repo.updateSpace(updated)
    auditLogService.logAction(userId, "PARKING_SPACE_UPDATED", "parking_spaces", Some(id), Some(s"Updated space details: ${updated.spaceNumber}"))
    broadcast(s"""{"event":"space_updated","spaceId":"${updated.id}","status":"${updated.status}"}""")
    broadcast("""{"event":"dashboard_updated"}""")
    updated
  }

  def updateSpaceStatus(id: UUID, status: String, userId: Option[UUID]): ParkingSpace = {
    val existing = repo.findSpaceById(id).getOrElse(throw NotFoundException(s"Parking space '$id' not found"))
    Validator.validateEnum(status.toUpperCase, Set("AVAILABLE", "OCCUPIED", "RESERVED", "OUT_OF_SERVICE"), "status")

    val updated = existing.copy(status = status.toUpperCase)
    repo.updateSpace(updated)
    auditLogService.logAction(userId, "PARKING_SPACE_STATUS_UPDATED", "parking_spaces", Some(id), Some(s"Updated space status to $status for space ${updated.spaceNumber}"))
    broadcast(s"""{"event":"space_updated","spaceId":"${updated.id}","status":"${updated.status}"}""")
    broadcast("""{"event":"dashboard_updated"}""")
    updated
  }

  def deleteSpace(id: UUID, userId: Option[UUID]): Boolean = {
    repo.findSpaceById(id).getOrElse(throw NotFoundException(s"Parking space '$id' not found"))
    val deleted = repo.deleteSpace(id)
    if (deleted) {
      auditLogService.logAction(userId, "PARKING_SPACE_DELETED", "parking_spaces", Some(id), Some(s"Deleted space ID: $id"))
      broadcast(s"""{"event":"space_updated","spaceId":"${id}","status":"DELETED"}""")
      broadcast("""{"event":"dashboard_updated"}""")
    }
    deleted
  }
}
