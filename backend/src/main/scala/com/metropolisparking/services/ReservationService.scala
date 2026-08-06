package com.metropolisparking.services

import com.metropolisparking.dto.{ReservationCreateRequest, ReservationResponse}
import com.metropolisparking.exceptions.{ConflictException, NotFoundException, ValidationException}
import com.metropolisparking.models.Reservation
import com.metropolisparking.repositories.{ParkingLotRepository, ReservationRepository, PricingRuleRepository}
import org.slf4j.LoggerFactory
import java.time.Instant
import java.util.UUID

class ReservationService(
  resRepo: ReservationRepository,
  lotRepo: ParkingLotRepository,
  pricingRuleRepo: PricingRuleRepository,
  auditLogService: AuditLogService,
  wsService: WebSocketService
) {
  private val logger = LoggerFactory.getLogger(classOf[ReservationService])

  private def broadcast(eventJson: String): Unit = Option(wsService).foreach(_.broadcast(eventJson))

  def makeReservation(req: ReservationCreateRequest, userId: UUID): Reservation = {
    val startTime = try { Instant.parse(req.startTime) } catch { case _: Throwable => throw ValidationException("Invalid start time format") }
    val endTime = try { Instant.parse(req.endTime) } catch { case _: Throwable => throw ValidationException("Invalid end time format") }

    val now = Instant.now()
    if (!startTime.isAfter(now.minusSeconds(300))) {
      throw ValidationException("Reservation start time must be in the future")
    }
    if (!startTime.isBefore(endTime)) {
      throw ValidationException("Reservation end time must be after the start time")
    }

    val vehicleType = req.vehicleType.toUpperCase

    resRepo.transaction { txDsl =>
      val space = lotRepo.findSpaceByIdForUpdate(req.spaceId, txDsl).getOrElse {
        throw NotFoundException(s"Parking space '${req.spaceId}' not found")
      }

      if (space.status.equalsIgnoreCase("OUT_OF_SERVICE") || space.status.equalsIgnoreCase("MAINTENANCE")) {
        throw ConflictException(s"Parking space '${space.spaceNumber}' is currently ${space.status} and cannot be reserved")
      }

      if (resRepo.hasOverlappingTx(req.spaceId, startTime, endTime, txDsl)) {
        throw ConflictException(s"Space '${space.spaceNumber}' is already reserved during the requested period")
      }

      val durationMinutes = java.time.Duration.between(startTime, endTime).toMinutes.max(1L)
      val ruleOpt = pricingRuleRepo.findRule(space.lotId, vehicleType)
      if (ruleOpt.isEmpty) {
        logger.warn(s"Pricing rule missing for lotId '${space.lotId}' and vehicleType '$vehicleType'. Falling back to default rate 10.00")
      }
      val rate = ruleOpt.map(_.rate).getOrElse(BigDecimal("10.00"))
      val ruleType = ruleOpt.map(_.ruleType.toUpperCase).getOrElse("HOURLY")
      val fee = ruleType match {
        case "FLAT"  => rate
        case "DAILY" => rate * Math.ceil(durationMinutes.toDouble / 1440.0).toLong
        case _       => rate * Math.ceil(durationMinutes.toDouble / 60.0).toLong
      }

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

      resRepo.create(res, Some(txDsl))

      auditLogService.logAction(
        Some(userId),
        "RESERVATION_CREATED",
        "reservations",
        Some(res.id),
        Some(s"User reserved space ${space.spaceNumber} from $startTime to $endTime. Fee: $fee")
      )

      broadcast("""{"event":"dashboard_updated"}""")
      res
    }
  }

  def listReservations(userId: UUID, role: String): List[ReservationResponse] = {
    val reservations = if (role.equalsIgnoreCase("ADMIN")) {
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

    if (!role.equalsIgnoreCase("ADMIN") && res.userId != userId) {
      throw ValidationException("You are not authorized to cancel this reservation")
    }

    if (res.status.equalsIgnoreCase("CANCELLED") || res.status.equalsIgnoreCase("COMPLETED")) {
      throw ConflictException(s"Cannot cancel a reservation that is already ${res.status.toLowerCase}")
    }

    resRepo.transaction { txDsl =>
      resRepo.update(res.copy(status = "CANCELLED"), Some(txDsl))

      lotRepo.findSpaceByIdForUpdate(res.spaceId, txDsl).foreach { space =>
        if (space.status.equalsIgnoreCase("RESERVED")) {
          lotRepo.updateSpace(space.copy(status = "AVAILABLE"), Some(txDsl))
        }
      }

      auditLogService.logAction(
        Some(userId),
        "RESERVATION_CANCELLED",
        "reservations",
        Some(id),
        Some(s"Reservation for space ID ${res.spaceId} cancelled")
      )

      broadcast("""{"event":"dashboard_updated"}""")
    }
  }
}
