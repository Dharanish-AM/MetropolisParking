package com.metropolisparking.services

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.metropolisparking.dto.{QrGenerateResponse, QrScanResponse, SessionEndRequest, SessionStartRequest}
import com.metropolisparking.exceptions.{NotFoundException, ValidationException}
import com.metropolisparking.repositories.{ParkingLotRepository, ParkingSessionRepository, ReservationRepository}
import java.util.{Date, UUID}
import scala.util.Try

class QrService(
  sessionService: ParkingSessionService,
  reservationService: ReservationService,
  sessionRepo: ParkingSessionRepository,
  resRepo: ReservationRepository,
  lotRepo: ParkingLotRepository,
  vehicleService: VehicleService,
  jwtSecret: String
) {
  private val algorithm = Algorithm.HMAC256(jwtSecret)
  private val verifier = JWT.require(algorithm).build()

  def generatePass(entityType: String, entityId: UUID): QrGenerateResponse = {
    entityType.toUpperCase match {
      case "SESSION" =>
        val session = sessionRepo.findById(entityId).getOrElse {
          throw NotFoundException(s"Parking session '$entityId' not found")
        }
        val space = lotRepo.findSpaceById(session.spaceId).map(_.spaceNumber).getOrElse("Unknown")
        val vehicle = vehicleService.getById(session.vehicleId).map(_.plateNumber).getOrElse("Unknown")

        val token = JWT.create()
          .withSubject(entityId.toString)
          .withClaim("entityType", "SESSION")
          .withClaim("plateNumber", vehicle)
          .withClaim("spaceNumber", space)
          .withIssuedAt(new Date())
          .withExpiresAt(new Date(System.currentTimeMillis() + 86400000L))
          .sign(algorithm)

        QrGenerateResponse(qrToken = token, payload = s"SESSION:$vehicle:$space:$entityId")

      case "RESERVATION" =>
        val res = resRepo.findById(entityId).getOrElse {
          throw NotFoundException(s"Reservation '$entityId' not found")
        }
        val space = lotRepo.findSpaceById(res.spaceId).map(_.spaceNumber).getOrElse("Unknown")

        val token = JWT.create()
          .withSubject(entityId.toString)
          .withClaim("entityType", "RESERVATION")
          .withClaim("spaceNumber", space)
          .withIssuedAt(new Date())
          .withExpiresAt(new Date(System.currentTimeMillis() + 86400000L))
          .sign(algorithm)

        QrGenerateResponse(qrToken = token, payload = s"RESERVATION:$space:$entityId")

      case _ =>
        throw ValidationException(s"Invalid QR entity type '$entityType'")
    }
  }

  def scanPass(qrToken: String): QrScanResponse = {
    val decoded = Try(verifier.verify(qrToken)).getOrElse {
      throw ValidationException("Invalid or expired QR code token")
    }

    val entityId = UUID.fromString(decoded.getSubject)
    val entityType = decoded.getClaim("entityType").asString().toUpperCase

    entityType match {
      case "SESSION" =>
        val session = sessionRepo.findById(entityId).getOrElse {
          throw NotFoundException(s"Parking session '$entityId' not found")
        }
        val vehicle = vehicleService.getById(session.vehicleId).map(_.plateNumber).getOrElse {
          throw NotFoundException("Vehicle for session not found")
        }
        val space = lotRepo.findSpaceById(session.spaceId).map(_.spaceNumber).getOrElse("Unknown")

        if (session.exitTime.isEmpty) {
          sessionService.endSession(SessionEndRequest(vehicle), None)
          QrScanResponse(
            action = "CHECKOUT",
            entityId = entityId,
            entityType = "SESSION",
            plateNumber = vehicle,
            spaceNumber = space,
            status = "COMPLETED",
            message = s"Gate opened for vehicle $vehicle checkout from space $space"
          )
        } else {
          QrScanResponse(
            action = "ALREADY_COMPLETED",
            entityId = entityId,
            entityType = "SESSION",
            plateNumber = vehicle,
            spaceNumber = space,
            status = "COMPLETED",
            message = s"Session for vehicle $vehicle has already ended"
          )
        }

      case "RESERVATION" =>
        val res = resRepo.findById(entityId).getOrElse {
          throw NotFoundException(s"Reservation '$entityId' not found")
        }
        val space = lotRepo.findSpaceById(res.spaceId).getOrElse {
          throw NotFoundException("Reserved space not found")
        }

        val userPlate = vehicleService.list()
          .find(_.ownerId.contains(res.userId))
          .map(_.plateNumber)
          .getOrElse(s"RES-${res.id.toString.take(8).toUpperCase}")

        if (res.status.equalsIgnoreCase("COMPLETED")) {
          QrScanResponse(
            action = "ALREADY_COMPLETED",
            entityId = entityId,
            entityType = "RESERVATION",
            plateNumber = userPlate,
            spaceNumber = space.spaceNumber,
            status = "COMPLETED",
            message = s"Reservation for space ${space.spaceNumber} has already been checked in"
          )
        } else if (res.status.equalsIgnoreCase("CANCELLED") || res.status.equalsIgnoreCase("EXPIRED")) {
          throw ValidationException(s"Reservation for space '${space.spaceNumber}' is ${res.status.toLowerCase}")
        } else {
          val activeSessions = sessionRepo.list(activeOnly = true)
          val existingSession = activeSessions.find(_.spaceId == res.spaceId)

          if (existingSession.isDefined) {
            resRepo.update(res.copy(status = "COMPLETED"))
            QrScanResponse(
              action = "ALREADY_COMPLETED",
              entityId = existingSession.get.id,
              entityType = "RESERVATION",
              plateNumber = userPlate,
              spaceNumber = space.spaceNumber,
              status = "ACTIVE",
              message = s"Reservation checked in for space ${space.spaceNumber} (Active session)"
            )
          } else if (space.status.equalsIgnoreCase("OUT_OF_SERVICE") || space.status.equalsIgnoreCase("MAINTENANCE")) {
            throw ValidationException(s"Parking space '${space.spaceNumber}' is currently out of service")
          } else {
            val session = sessionService.startSession(
              SessionStartRequest(plateNumber = userPlate, spaceId = res.spaceId),
              Some(res.userId)
            )

            resRepo.update(res.copy(status = "COMPLETED"))

            QrScanResponse(
              action = "CHECKIN",
              entityId = session.id,
              entityType = "RESERVATION",
              plateNumber = userPlate,
              spaceNumber = space.spaceNumber,
              status = "ACTIVE",
              message = s"Gate opened for reserved space ${space.spaceNumber}"
            )
          }
        }

      case _ =>
        throw ValidationException(s"Unsupported entity type '$entityType'")
    }
  }
}
