package com.metropolisparking.services

import com.metropolisparking.dto.{AnprEntryRequest, AnprExitRequest, AnprEntryResponse, AnprExitResponse}
import com.metropolisparking.dto.{SessionStartRequest, SessionEndRequest, VehicleCreateRequest, PaymentProcessRequest}
import com.metropolisparking.exceptions.{ConflictException, NotFoundException}
import com.metropolisparking.repositories.{ParkingLotRepository, PaymentRepository}
import java.util.UUID

class AnprService(
  lotRepo: ParkingLotRepository,
  paymentRepo: PaymentRepository,
  vehicleService: VehicleService,
  sessionService: ParkingSessionService,
  paymentService: PaymentService,
  wsService: WebSocketService
) {
  def simulateEntry(req: AnprEntryRequest): AnprEntryResponse = {
    val cleanPlate = req.plateNumber.toUpperCase.replaceAll("\\s", "")

    val vehicle = vehicleService.getByPlateNumber(cleanPlate).getOrElse {
      val createReq = VehicleCreateRequest(cleanPlate, "CAR", None)
      vehicleService.register(createReq, None)
    }

    val space = lotRepo.listSpaces(Some(req.lotId), None)
      .find(_.status.equalsIgnoreCase("AVAILABLE"))
      .getOrElse(throw ConflictException(s"Parking lot '${req.lotId}' has no available spaces"))

    val session = sessionService.startSession(SessionStartRequest(cleanPlate, space.id), None)

    val levelNumber = lotRepo.listLevels(req.lotId)
      .find(_.id == space.levelId)
      .map(_.levelNumber)
      .getOrElse(0)

    wsService.broadcast("""{"event":"dashboard_updated"}""")

    AnprEntryResponse(
      sessionId = session.id,
      plateNumber = cleanPlate,
      spaceNumber = space.spaceNumber,
      levelNumber = levelNumber,
      entryTime = session.entryTime.toString
    )
  }

  def simulateExit(req: AnprExitRequest): AnprExitResponse = {
    val cleanPlate = req.plateNumber.toUpperCase.replaceAll("\\s", "")

    val session = sessionService.endSession(SessionEndRequest(cleanPlate), None)

    val payment = paymentRepo.findBySessionId(session.id).getOrElse {
      throw NotFoundException(s"Payment record not found for session '${session.id}'")
    }

    val settledPayment = paymentService.processPayment(payment.id, PaymentProcessRequest("CARD"), None)

    wsService.broadcast("""{"event":"dashboard_updated"}""")

    AnprExitResponse(
      sessionId = session.id,
      plateNumber = cleanPlate,
      durationMinutes = session.durationMinutes.getOrElse(0).toLong,
      fee = session.fee.getOrElse(BigDecimal("0.00")),
      paymentStatus = settledPayment.status
    )
  }
}
