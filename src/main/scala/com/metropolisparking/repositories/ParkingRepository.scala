package com.metropolisparking.repositories

import com.metropolisparking.models.{ParkingSpot, ParkingTicket}
import scala.concurrent.Future

/**
 * Interface defining storage abstractions for parking operations.
 * Separating the interface allows easily swapping out the database implementation (e.g., in-memory vs Postgres) in future deliverables.
 */
trait ParkingRepository {
  def getSpot(id: String): Future[Option[ParkingSpot]]
  def listSpots(): Future[Seq[ParkingSpot]]
  def updateSpot(spot: ParkingSpot): Future[ParkingSpot]
  
  def issueTicket(ticket: ParkingTicket): Future[ParkingTicket]
  def getTicket(id: String): Future[Option[ParkingTicket]]
  def updateTicket(ticket: ParkingTicket): Future[ParkingTicket]
}
