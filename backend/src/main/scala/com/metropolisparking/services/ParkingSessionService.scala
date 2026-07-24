package com.metropolisparking.services

import com.metropolisparking.dto.{SessionStartRequest, SessionEndRequest, VehicleCreateRequest}
import com.metropolisparking.exceptions.{ConflictException, NotFoundException}
import com.metropolisparking.models.{ParkingSession, Payment}
import com.metropolisparking.repositories.{ParkingLotRepository, ParkingSessionRepository, PaymentRepository, PricingRuleRepository}
import java.time.Instant
import java.util.UUID

class ParkingSessionService(
  sessionRepo: ParkingSessionRepository,
  lotRepo: ParkingLotRepository,
  vehicleService: VehicleService,
  pricingRuleRepo: PricingRuleRepository,
  paymentRepo: PaymentRepository,
  auditLogService: AuditLogService,
  wsService: WebSocketService = null
) {
  private def broadcast(eventJson: String): Unit = Option(wsService).foreach(_.broadcast(eventJson))
  def startSession(req: SessionStartRequest, userId: Option[UUID]): ParkingSession = {
    val vehicle = vehicleService.getByPlateNumber(req.plateNumber).getOrElse {
      vehicleService.register(VehicleCreateRequest(req.plateNumber, "CAR", None), userId)
    }

    val space = lotRepo.findSpaceById(req.spaceId).getOrElse {
      throw NotFoundException(s"Parking space '${req.spaceId}' not found")
    }

    if (!space.status.equalsIgnoreCase("AVAILABLE")) {
      throw ConflictException(s"Parking space '${space.spaceNumber}' is currently ${space.status}")
    }

    sessionRepo.findActiveByVehicleId(vehicle.id).foreach { _ =>
      throw ConflictException(s"Vehicle '${vehicle.plateNumber}' already has an active parking session")
    }

    sessionRepo.transaction { txDsl =>
      val updatedSpace = space.copy(status = "OCCUPIED")
      lotRepo.updateSpace(updatedSpace)

      val session = ParkingSession(
        id = UUID.randomUUID(),
        vehicleId = vehicle.id,
        spaceId = space.id,
        entryTime = Instant.now()
      )
      sessionRepo.create(session)

      auditLogService.logAction(
        userId,
        "SESSION_STARTED",
        "parking_sessions",
        Some(session.id),
        Some(s"Vehicle ${vehicle.plateNumber} entered space ${space.spaceNumber}")
      )
      broadcast(s"""{"event":"space_updated","spaceId":"${space.id}","status":"OCCUPIED"}""")
      broadcast("""{"event":"dashboard_updated"}""")
      session
    }
  }

  def endSession(req: SessionEndRequest, userId: Option[UUID]): ParkingSession = {
    val vehicle = vehicleService.getByPlateNumber(req.plateNumber).getOrElse {
      throw NotFoundException(s"Vehicle with plate number '${req.plateNumber}' not found")
    }

    val session = sessionRepo.findActiveByVehicleId(vehicle.id).getOrElse {
      throw NotFoundException(s"No active parking session found for vehicle '${vehicle.plateNumber}'")
    }

    val space = lotRepo.findSpaceById(session.spaceId).getOrElse {
      throw NotFoundException(s"Parking space '${session.spaceId}' not found for active session")
    }

    val exitTime = Instant.now()
    val durationMinutes = java.time.Duration.between(session.entryTime, exitTime).toMinutes.max(1L).toInt
    val fee = calculateFee(session.entryTime, exitTime, space.lotId, vehicle.`type`)

    sessionRepo.transaction { txDsl =>
      val updatedSpace = space.copy(status = "AVAILABLE")
      lotRepo.updateSpace(updatedSpace)

      val updatedSession = session.copy(
        exitTime = Some(exitTime),
        durationMinutes = Some(durationMinutes),
        fee = Some(fee)
      )
      sessionRepo.update(updatedSession)

      val payment = Payment(
        id = UUID.randomUUID(),
        sessionId = session.id,
        amount = fee,
        method = "PENDING",
        status = "PENDING"
      )
      paymentRepo.create(payment)

      auditLogService.logAction(
        userId,
        "SESSION_ENDED",
        "parking_sessions",
        Some(session.id),
        Some(s"Vehicle ${vehicle.plateNumber} left space ${space.spaceNumber}. Fee: $fee")
      )
      broadcast(s"""{"event":"space_updated","spaceId":"${space.id}","status":"AVAILABLE"}""")
      broadcast("""{"event":"dashboard_updated"}""")
      updatedSession
    }
  }

  def list(activeOnly: Boolean): List[ParkingSession] = {
    sessionRepo.list(activeOnly)
  }

  def getSession(id: UUID): Option[ParkingSession] = {
    sessionRepo.findById(id)
  }

  def getHistory(plateNumber: String): List[ParkingSession] = {
    val vehicle = vehicleService.getByPlateNumber(plateNumber).getOrElse {
      throw NotFoundException(s"Vehicle with plate number '$plateNumber' not found")
    }
    sessionRepo.listByVehicleId(vehicle.id)
  }

  private def calculateFee(entryTime: Instant, exitTime: Instant, lotId: UUID, vehicleType: String): BigDecimal = {
    val durationMinutes = java.time.Duration.between(entryTime, exitTime).toMinutes.max(1L)
    val rule = pricingRuleRepo.findRule(lotId, vehicleType)

    val rate = rule.map(_.rate).getOrElse(BigDecimal("5.00"))
    val ruleType = rule.map(_.ruleType.toUpperCase).getOrElse("HOURLY")

    ruleType match {
      case "HOURLY" =>
        val hours = Math.ceil(durationMinutes.toDouble / 60.0).toLong
        rate * hours
      case "DAILY" =>
        val days = Math.ceil(durationMinutes.toDouble / 1440.0).toLong
        rate * days
      case "FLAT" =>
        rate
      case _ =>
        val hours = Math.ceil(durationMinutes.toDouble / 60.0).toLong
        rate * hours
    }
  }
}
