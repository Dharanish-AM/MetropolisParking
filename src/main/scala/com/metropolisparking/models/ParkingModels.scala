package com.metropolisparking.models

import java.time.Instant

/**
 * Domain model representing a parking spot.
 * Placed in the models package to represent pure data structures without logic dependencies.
 */
case class ParkingSpot(
  id: String,
  spotNumber: String,
  spotType: String, // e.g., Compact, Large, Handicap, Electric
  isOccupied: Boolean
)

/**
 * Domain model representing a parking ticket issued to a vehicle.
 */
case class ParkingTicket(
  id: String,
  spotId: String,
  licensePlate: String,
  issuedAt: Instant,
  paidAt: Option[Instant] = None,
  amountPaid: Option[BigDecimal] = None
)
