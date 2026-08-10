package com.metropolisparking.services

import com.metropolisparking.dto.{SessionStartRequest, SessionEndRequest, VehicleCreateRequest}
import com.metropolisparking.exceptions.{ConflictException, NotFoundException}
import com.metropolisparking.models.{ParkingSession, Payment}
import com.metropolisparking.repositories.{ParkingLotRepository, ParkingSessionRepository, PaymentRepository, PricingRuleRepository, ReservationRepository}
import org.slf4j.LoggerFactory
import java.time.Instant
import java.util.UUID

class ParkingSessionService(
  sessionRepo: ParkingSessionRepository,
  lotRepo: ParkingLotRepository,
  vehicleService: VehicleService,
  pricingRuleRepo: PricingRuleRepository,
  paymentRepo: PaymentRepository,
  auditLogService: AuditLogService,
  wsService: WebSocketService = null,
  dashboardService: Option[DashboardService] = None,
  reservationRepo: Option[ReservationRepository] = None
) {
  private val logger = LoggerFactory.getLogger(classOf[ParkingSessionService])
  private def broadcast(eventJson: String): Unit = {
    Option(wsService).foreach(_.broadcast(eventJson))
    dashboardService.foreach(_.invalidateCache())
  }
  def startSession(req: SessionStartRequest, userId: Option[UUID]): ParkingSession = {
    val vehicle = vehicleService.getByPlateNumber(req.plateNumber).getOrElse {
      vehicleService.register(VehicleCreateRequest(req.plateNumber, "CAR", None), userId)
    }

    sessionRepo.transaction { txDsl =>
      val space = lotRepo.findSpaceByIdForUpdate(req.spaceId, txDsl).getOrElse {
        throw NotFoundException(s"Parking space '${req.spaceId}' not found")
      }

      if (!space.status.equalsIgnoreCase("AVAILABLE") && !space.status.equalsIgnoreCase("RESERVED")) {
        throw ConflictException(s"Parking space '${space.spaceNumber}' is currently ${space.status}")
      }

      reservationRepo.foreach { rRepo =>
        val now = Instant.now()
        rRepo.findActiveBySpaceId(space.id).foreach { res =>
          if (res.startTime.isBefore(now.plusSeconds(300)) && res.endTime.isAfter(now)) {
            val isReservationOwner = userId.contains(res.userId) || vehicle.ownerId.contains(res.userId)
            if (!isReservationOwner && space.status.equalsIgnoreCase("RESERVED")) {
              throw ConflictException(s"Parking space '${space.spaceNumber}' is currently reserved for another customer")
            }
          }
        }
      }

      sessionRepo.findActiveByVehicleId(vehicle.id).foreach { _ =>
        throw ConflictException(s"Vehicle '${vehicle.plateNumber}' already has an active parking session")
      }

      val updatedSpace = space.copy(status = "OCCUPIED")
      lotRepo.updateSpace(updatedSpace, Some(txDsl))

      val session = ParkingSession(
        id = UUID.randomUUID(),
        vehicleId = vehicle.id,
        spaceId = space.id,
        entryTime = Instant.now()
      )
      sessionRepo.create(session, Some(txDsl))

      auditLogService.logAction(
        userId,
        "SESSION_STARTED",
        "parking_sessions",
        Some(session.id),
        Some(s"Vehicle ${vehicle.plateNumber} entered space ${space.spaceNumber}"),
        Some(txDsl)
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

    val exitTime = Instant.now()

    sessionRepo.transaction { txDsl =>
      val space = lotRepo.findSpaceByIdForUpdate(session.spaceId, txDsl).getOrElse {
        throw NotFoundException(s"Parking space '${session.spaceId}' not found for active session")
      }

      val durationMinutes = java.time.Duration.between(session.entryTime, exitTime).toMinutes.max(1L).toInt
      val fee = calculateFee(session.entryTime, exitTime, space.lotId, vehicle.`type`)

      val updatedSpace = space.copy(status = "AVAILABLE")
      lotRepo.updateSpace(updatedSpace, Some(txDsl))

      val updatedSession = session.copy(
        exitTime = Some(exitTime),
        durationMinutes = Some(durationMinutes),
        fee = Some(fee)
      )
      sessionRepo.update(updatedSession, Some(txDsl))

      val payment = Payment(
        id = UUID.randomUUID(),
        sessionId = session.id,
        amount = fee,
        method = "PENDING",
        status = "PENDING"
      )
      paymentRepo.create(payment, Some(txDsl))

      auditLogService.logAction(
        userId,
        "SESSION_ENDED",
        "parking_sessions",
        Some(session.id),
        Some(s"Vehicle ${vehicle.plateNumber} left space ${space.spaceNumber}. Fee: $fee"),
        Some(txDsl)
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
    val ruleOpt = pricingRuleRepo.findRule(lotId, vehicleType)

    val rule = ruleOpt.getOrElse {
      logger.warn(s"Pricing rule missing for lotId '$lotId' and vehicleType '$vehicleType'. Falling back to default rate 5.00")
      com.metropolisparking.models.PricingRule(
        id = UUID.randomUUID(),
        ruleType = "HOURLY",
        rate = BigDecimal("5.00"),
        vehicleType = Some(vehicleType),
        lotId = Some(lotId)
      )
    }

    val hours = Math.ceil(durationMinutes.toDouble / 60.0).toLong
    val baseFee: BigDecimal = rule.ruleType.toUpperCase match {
      case "DAILY" =>
        val days = Math.ceil(hours.toDouble / 24.0).toLong.max(1L)
        rule.rate * days
      case "FLAT" | "OVERNIGHT" =>
        rule.rate
      case _ =>
        rule.rate * hours
    }

    val entryZdt = java.time.ZonedDateTime.ofInstant(entryTime, java.time.ZoneId.systemDefault())
    val entryHour = entryZdt.getHour
    val isPeakHour = entryHour >= rule.startHour && entryHour < rule.endHour

    val multiplier = if (isPeakHour) rule.surgeMultiplier.max(BigDecimal("1.00")) else BigDecimal("1.00")
    val totalFee = (baseFee * multiplier).setScale(2, scala.math.BigDecimal.RoundingMode.HALF_UP)

    totalFee.min(rule.maxDailyCap).max(rule.minFee)
  }
}
