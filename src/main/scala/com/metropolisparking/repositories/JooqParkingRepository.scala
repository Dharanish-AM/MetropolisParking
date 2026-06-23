package com.metropolisparking.repositories

import com.metropolisparking.models.{ParkingSpot, ParkingTicket}
import java.time.Instant
import scala.concurrent.{ExecutionContext, Future}
import org.jooq.DSLContext
import org.jooq.impl.DSL._

class JooqParkingRepository(val dsl: DSLContext)(implicit ec: ExecutionContext)
  extends ParkingRepository {

  // Schema definitions
  private val PARKING_SPOTS = table("parking_spots")
  private val SPOT_ID = field("id", classOf[String])
  private val SPOT_NUMBER = field("spot_number", classOf[String])
  private val SPOT_TYPE = field("spot_type", classOf[String])
  private val SPOT_IS_OCCUPIED = field("is_occupied", classOf[java.lang.Boolean])

  private val PARKING_TICKETS = table("parking_tickets")
  private val TICKET_ID = field("id", classOf[String])
  private val TICKET_SPOT_ID = field("spot_id", classOf[String])
  private val TICKET_LICENSE_PLATE = field("license_plate", classOf[String])
  private val TICKET_ISSUED_AT = field("issued_at", classOf[java.time.Instant])
  private val TICKET_PAID_AT = field("paid_at", classOf[java.time.Instant])
  private val TICKET_AMOUNT_PAID = field("amount_paid", classOf[java.math.BigDecimal])

  override def getSpot(id: String): Future[Option[ParkingSpot]] = Future {
    val record = dsl.select(SPOT_ID, SPOT_NUMBER, SPOT_TYPE, SPOT_IS_OCCUPIED)
      .from(PARKING_SPOTS)
      .where(SPOT_ID.eq(id))
      .fetchOne()

    Option(record).map { r =>
      ParkingSpot(
        id = r.get(SPOT_ID),
        spotNumber = r.get(SPOT_NUMBER),
        spotType = r.get(SPOT_TYPE),
        isOccupied = r.get(SPOT_IS_OCCUPIED)
      )
    }
  }

  override def listSpots(): Future[Seq[ParkingSpot]] = Future {
    val records = dsl.select(SPOT_ID, SPOT_NUMBER, SPOT_TYPE, SPOT_IS_OCCUPIED)
      .from(PARKING_SPOTS)
      .fetch()

    import scala.jdk.CollectionConverters._
    records.asScala.map { r =>
      ParkingSpot(
        id = r.get(SPOT_ID),
        spotNumber = r.get(SPOT_NUMBER),
        spotType = r.get(SPOT_TYPE),
        isOccupied = r.get(SPOT_IS_OCCUPIED)
      )
    }.toSeq
  }

  override def updateSpot(spot: ParkingSpot): Future[ParkingSpot] = Future {
    val updated = dsl.update(PARKING_SPOTS)
      .set(SPOT_NUMBER, spot.spotNumber)
      .set(SPOT_TYPE, spot.spotType)
      .set(SPOT_IS_OCCUPIED, java.lang.Boolean.valueOf(spot.isOccupied))
      .where(SPOT_ID.eq(spot.id))
      .execute()

    if (updated == 0) {
      dsl.insertInto(PARKING_SPOTS)
        .set(SPOT_ID, spot.id)
        .set(SPOT_NUMBER, spot.spotNumber)
        .set(SPOT_TYPE, spot.spotType)
        .set(SPOT_IS_OCCUPIED, java.lang.Boolean.valueOf(spot.isOccupied))
        .execute()
    }
    spot
  }

  override def issueTicket(ticket: ParkingTicket): Future[ParkingTicket] = Future {
    val insert = dsl.insertInto(PARKING_TICKETS)
      .set(TICKET_ID, ticket.id)
      .set(TICKET_SPOT_ID, ticket.spotId)
      .set(TICKET_LICENSE_PLATE, ticket.licensePlate)
      .set(TICKET_ISSUED_AT, ticket.issuedAt)

    ticket.paidAt.foreach(t => insert.set(TICKET_PAID_AT, t))
    ticket.amountPaid.foreach(a => insert.set(TICKET_AMOUNT_PAID, a.bigDecimal))

    insert.execute()
    ticket
  }

  override def getTicket(id: String): Future[Option[ParkingTicket]] = Future {
    val record = dsl.select(TICKET_ID, TICKET_SPOT_ID, TICKET_LICENSE_PLATE, TICKET_ISSUED_AT, TICKET_PAID_AT, TICKET_AMOUNT_PAID)
      .from(PARKING_TICKETS)
      .where(TICKET_ID.eq(id))
      .fetchOne()

    Option(record).map { r =>
      val paidAtVal = Option(r.get(TICKET_PAID_AT))
      val amountPaidVal = Option(r.get(TICKET_AMOUNT_PAID)).map(BigDecimal(_))
      
      ParkingTicket(
        id = r.get(TICKET_ID),
        spotId = r.get(TICKET_SPOT_ID),
        licensePlate = r.get(TICKET_LICENSE_PLATE),
        issuedAt = r.get(TICKET_ISSUED_AT),
        paidAt = paidAtVal,
        amountPaid = amountPaidVal
      )
    }
  }

  override def updateTicket(ticket: ParkingTicket): Future[ParkingTicket] = Future {
    val update = dsl.update(PARKING_TICKETS)
      .set(TICKET_SPOT_ID, ticket.spotId)
      .set(TICKET_LICENSE_PLATE, ticket.licensePlate)
      .set(TICKET_ISSUED_AT, ticket.issuedAt)

    ticket.paidAt.map(t => update.set(TICKET_PAID_AT, t)).getOrElse(update.setNull(TICKET_PAID_AT))
    ticket.amountPaid.map(a => update.set(TICKET_AMOUNT_PAID, a.bigDecimal)).getOrElse(update.setNull(TICKET_AMOUNT_PAID))

    val updated = update.where(TICKET_ID.eq(ticket.id)).execute()

    if (updated == 0) {
      val insert = dsl.insertInto(PARKING_TICKETS)
        .set(TICKET_ID, ticket.id)
        .set(TICKET_SPOT_ID, ticket.spotId)
        .set(TICKET_LICENSE_PLATE, ticket.licensePlate)
        .set(TICKET_ISSUED_AT, ticket.issuedAt)

      ticket.paidAt.foreach(t => insert.set(TICKET_PAID_AT, t))
      ticket.amountPaid.foreach(a => insert.set(TICKET_AMOUNT_PAID, a.bigDecimal))

      insert.execute()
    }
    ticket
  }
}
