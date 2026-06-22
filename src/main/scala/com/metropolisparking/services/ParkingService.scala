package com.metropolisparking.services

import com.metropolisparking.models.{ParkingSpot, ParkingTicket}
import scala.concurrent.Future

/**
 * Interface defining high-level business actions for Metropolis Parking operations.
 * Isolates business logic from the HTTP routes framework.
 */
trait ParkingService {
  def checkInVehicle(licensePlate: String, spotType: String): Future[Either[String, ParkingTicket]]
  def checkOutVehicle(ticketId: String): Future[Either[String, ParkingTicket]]
  def getAvailableSpotsCount(): Future[Map[String, Int]]
}
