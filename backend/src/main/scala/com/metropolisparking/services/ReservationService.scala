package com.metropolisparking.services

import com.metropolisparking.dto.{ReservationCreateRequest, ReservationResponse}
import com.metropolisparking.exceptions.{ConflictException, NotFoundException, ValidationException}
import com.metropolisparking.models.Reservation
import com.metropolisparking.repositories.{ParkingLotRepository, ReservationRepository, PricingRuleRepository}
import java.time.Instant
import java.util.UUID

class ReservationService(
  resRepo: ReservationRepository,
  lotRepo: ParkingLotRepository,
  pricingRuleRepo: PricingRuleRepository,
  auditLogService: AuditLogService,
  wsService: WebSocketService
) {
  def makeReservation(req: ReservationCreateRequest, userId: UUID): Reservation = {
    val space = lotRepo.findSpaceById(req.spaceId).getOrElse {
      throw NotFoundException(s"Parking space '${req.spaceId}' not found")
    }

    val startTime = try { Instant.parse(req.startTime) } catch { case _: Throwable => throw ValidationException("Invalid start time format") }
    val endTime = try { Instant.parse(req.endTime) } catch { case _: Throwable => throw ValidationException("Invalid end time format") }

    val now = Instant.now()
    if (!startTime.isAfter(now)) {
      throw ValidationException("Reservation start time must be in the future")
    }
    if (!startTime.isBefore(endTime)) {
      throw ValidationException("Reservation end time must be after the start time")
    }

    if (resRepo.hasOverlapping(req.spaceId, startTime, endTime)) {
      throw ConflictException(s"Space '${space.spaceNumber}' is already reserved during the requested period")
    }

    val durationMinutes = java.time.Duration.between(startTime, endTime).toMinutes.max(1L)
    val rule = pricingRuleRepo.findRule(space.lotId, space.`type`)
    val rate = rule.map(_.rate).getOrElse(BigDecimal("5.00"))
    val hours = Math.ceil(durationMinutes.toDouble / 60.0).toLong
    val fee = rate * hours

    val res = Reservation(
      id = UUID.randomUUID(),
      userId = userId,
      spaceId = req.spaceId,
      startTime = startTime,
      endTime = endTime,
      status = "CONFIRMED",
      fee = fee,
      createdAt = now,
      updatedAt = now
    )

    resRepo.create(res)

    auditLogService.logAction(
      Some(userId),
      "RESERVATION_CREATED",
      "reservations",
      Some(res.id),
      Some(s"User reserved space ${space.spaceNumber} from $startTime to $endTime. Fee: $fee")
    )

    wsService.broadcast("""{"event":"dashboard_updated"}""")

    res
  }

  def listReservations(userId: UUID, role: String): List[ReservationResponse] = {
    val reservations = if (role.equalsIgnoreCase("ADMIN") || role.equalsIgnoreCase("OPERATOR")) {
      resRepo.listAll()
    } else {
      resRepo.listByUserId(userId)
    }

    reservations.map { res =>
      val space = lotRepo.findSpaceById(res.spaceId)
      val spaceNum = space.map(_.spaceNumber).getOrElse("Unknown")
      val lotName = space.flatMap(s => lotRepo.findById(s.lotId)).map(_.name).getOrElse("Unknown")
      
      ReservationResponse(
        id = res.id,
        userId = res.userId,
        spaceId = res.spaceId,
        spaceNumber = spaceNum,
        lotName = lotName,
        startTime = res.startTime.toString,
        endTime = res.endTime.toString,
        status = res.status,
        fee = res.fee
      )
    }
  }

  def cancelReservation(id: UUID, userId: UUID, role: String): Unit = {
    val res = resRepo.findById(id).getOrElse {
      throw NotFoundException(s"Reservation '$id' not found")
    }

    if (!role.equalsIgnoreCase("ADMIN") && !role.equalsIgnoreCase("OPERATOR") && res.userId != userId) {
      throw ValidationException("You are not authorized to cancel this reservation")
    }

    if (res.status.equalsIgnoreCase("CANCELLED") || res.status.equalsIgnoreCase("COMPLETED")) {
      throw ConflictException(s"Cannot cancel a reservation that is already ${res.status.toLowerCase}")
    }

    val updated = res.copy(status = "CANCELLED")
    resRepo.update(updated)

    auditLogService.logAction(
      Some(userId),
      "RESERVATION_CANCELLED",
      "reservations",
      Some(id),
      Some(s"Reservation for space ID ${res.spaceId} cancelled")
    )

    wsService.broadcast("""{"event":"dashboard_updated"}""")
  }
}
