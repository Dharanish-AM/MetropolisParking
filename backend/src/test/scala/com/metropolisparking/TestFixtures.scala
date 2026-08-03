package com.metropolisparking

import com.metropolisparking.models._
import com.metropolisparking.repositories._
import org.jooq.DSLContext
import java.time.Instant
import java.util.UUID

object TestFixtures {
  def aLot(dsl: DSLContext, name: String = "Test Lot", location: String = "Downtown"): ParkingLot = {
    val repo = new ParkingLotRepository(dsl)
    val lot = ParkingLot(UUID.randomUUID(), name, location)
    repo.create(lot)
  }

  def aLevel(dsl: DSLContext, lotId: UUID, levelNumber: Int = 1): ParkingLevel = {
    val repo = new ParkingLotRepository(dsl)
    val level = ParkingLevel(UUID.randomUUID(), lotId, levelNumber)
    repo.createLevel(level)
  }

  def aSpace(dsl: DSLContext, lotId: UUID, levelId: UUID, spaceNumber: String = "A-101", spaceType: String = "CAR", status: String = "AVAILABLE"): ParkingSpace = {
    val repo = new ParkingLotRepository(dsl)
    val space = ParkingSpace(UUID.randomUUID(), lotId, levelId, spaceNumber, spaceType, status)
    repo.createSpace(space)
  }

  def aUser(dsl: DSLContext, roleName: String = "CUSTOMER", name: String = "Test User", email: String = s"test-${UUID.randomUUID()}@example.com"): User = {
    val repo = new UserRepository(dsl)
    val roleId = repo.getRoleIdByName(roleName).getOrElse(throw new IllegalStateException(s"Role $roleName not found"))
    val user = User(UUID.randomUUID(), name, email, "$2a$10$wE9923K/g16yLdFvP7W53.Oq8uF7QG4vYq9x1nN7f1N/1N1N1N1N1", roleId)
    repo.create(user)
  }

  def aVehicle(dsl: DSLContext, plateNumber: String = "MH12AB1234", vehicleType: String = "CAR", ownerId: Option[UUID] = None): Vehicle = {
    val repo = new VehicleRepository(dsl)
    val vehicle = Vehicle(UUID.randomUUID(), plateNumber.toUpperCase, vehicleType, ownerId)
    repo.create(vehicle)
  }

  def aSession(dsl: DSLContext, spaceId: UUID, plateNumber: String = "MH12AB1234", entryTime: Instant = Instant.now()): ParkingSession = {
    val vehicleRepo = new VehicleRepository(dsl)
    val vehicle = vehicleRepo.findByPlateNumber(plateNumber).getOrElse(aVehicle(dsl, plateNumber))
    val sessionRepo = new ParkingSessionRepository(dsl)
    val session = ParkingSession(UUID.randomUUID(), vehicle.id, spaceId, entryTime)
    sessionRepo.create(session)
  }

  def aReservation(dsl: DSLContext, spaceId: UUID, userId: Option[UUID] = None, startTime: Instant = Instant.now(), endTime: Instant = Instant.now().plusSeconds(3600), status: String = "CONFIRMED", fee: BigDecimal = BigDecimal(15.00)): Reservation = {
    val uid = userId.getOrElse(aUser(dsl, "CUSTOMER").id)
    val reservationRepo = new ReservationRepository(dsl)
    val reservation = Reservation(UUID.randomUUID(), uid, spaceId, startTime, endTime, status, fee, Instant.now(), Instant.now())
    reservationRepo.create(reservation, None)
  }

  def aFlatRule(dsl: DSLContext, lotId: UUID, rate: BigDecimal = BigDecimal(10.00), vehicleType: Option[String] = None): PricingRule = {
    val repo = new PricingRuleRepository(dsl)
    val rule = PricingRule(UUID.randomUUID(), "FLAT", rate, vehicleType, Some(lotId))
    repo.create(rule)
  }

  def anHourlyRule(dsl: DSLContext, lotId: UUID, rate: BigDecimal = BigDecimal(5.00), vehicleType: Option[String] = None): PricingRule = {
    val repo = new PricingRuleRepository(dsl)
    val rule = PricingRule(UUID.randomUUID(), "HOURLY", rate, vehicleType, Some(lotId))
    repo.create(rule)
  }
}
