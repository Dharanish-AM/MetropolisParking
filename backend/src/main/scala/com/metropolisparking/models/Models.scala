package com.metropolisparking.models

import java.time.Instant
import java.util.UUID

case class User(
  id: UUID,
  name: String,
  email: String,
  passwordHash: String,
  roleId: UUID
)

case class Vehicle(
  id: UUID,
  plateNumber: String,
  `type`: String,
  ownerId: Option[UUID],
  deletedAt: Option[Instant] = None
)

case class ParkingLot(
  id: UUID,
  name: String,
  location: String,
  deletedAt: Option[Instant] = None
)

case class ParkingLevel(
  id: UUID,
  lotId: UUID,
  levelNumber: Int
)

case class ParkingSpace(
  id: UUID,
  lotId: UUID,
  levelId: UUID,
  spaceNumber: String,
  `type`: String,
  status: String,
  deletedAt: Option[Instant] = None
)

case class ParkingSession(
  id: UUID,
  vehicleId: UUID,
  spaceId: UUID,
  entryTime: Instant,
  exitTime: Option[Instant] = None,
  durationMinutes: Option[Int] = None,
  fee: Option[BigDecimal] = None
)

case class Payment(
  id: UUID,
  sessionId: UUID,
  amount: BigDecimal,
  method: String,
  status: String
)

case class PricingRule(
  id: UUID,
  ruleType: String,
  rate: BigDecimal,
  vehicleType: Option[String] = None,
  lotId: Option[UUID] = None
)

case class AuditLog(
  id: UUID,
  userId: Option[UUID],
  action: String,
  entityType: String,
  entityId: Option[UUID],
  details: Option[String],
  timestamp: Instant
)
