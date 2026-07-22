package com.metropolisparking.services

import com.metropolisparking.dto.VehicleCreateRequest
import com.metropolisparking.exceptions.ConflictException
import com.metropolisparking.models.Vehicle
import com.metropolisparking.repositories.VehicleRepository
import com.metropolisparking.validation.Validator
import java.util.UUID

class VehicleService(
  repo: VehicleRepository,
  auditLogService: AuditLogService
) {
  def register(req: VehicleCreateRequest, userId: Option[UUID]): Vehicle = {
    Validator.validatePlateNumber(req.plateNumber)
    Validator.validateEnum(req.`type`.toUpperCase, Set("CAR", "BIKE", "SUV", "TRUCK", "EV"), "type")

    val plateClean = req.plateNumber.replaceAll("\\s+", "").toUpperCase

    repo.findByPlateNumber(plateClean).foreach { _ =>
      throw ConflictException(s"Vehicle with plate number '${req.plateNumber}' is already registered")
    }

    val vehicle = Vehicle(
      id = UUID.randomUUID(),
      plateNumber = plateClean,
      `type` = req.`type`.toUpperCase,
      ownerId = req.ownerId
    )
    repo.create(vehicle)
    auditLogService.logAction(userId, "VEHICLE_REGISTERED", "vehicles", Some(vehicle.id), Some(s"Registered vehicle: ${vehicle.plateNumber}"))
    vehicle
  }

  def getByPlateNumber(plateNumber: String): Option[Vehicle] = {
    val plateClean = plateNumber.replaceAll("\\s+", "").toUpperCase
    repo.findByPlateNumber(plateClean)
  }

  def list(): List[Vehicle] = repo.list()
}
