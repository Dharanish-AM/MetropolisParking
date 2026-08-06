package com.metropolisparking.services

import akka.actor.ActorSystem
import org.jooq.DSLContext
import com.metropolisparking.jooq.Tables.{PARKING_SPACES, RESERVATIONS}
import java.time.{Instant, OffsetDateTime, ZoneOffset}
import scala.concurrent.ExecutionContext
import scala.concurrent.duration._
import scala.util.Try

class BackgroundJobScheduler(
  dsl: DSLContext,
  wsService: WebSocketService,
  redisService: Option[RedisService] = None
)(implicit system: ActorSystem, ec: ExecutionContext) {

  def start(): Unit = {
    system.scheduler.scheduleAtFixedRate(10.seconds, 60.seconds) { () =>
      Try {
        cleanupExpiredReservations()
      }
    }
  }

  private def cleanupExpiredReservations(): Unit = {
    val now = OffsetDateTime.ofInstant(Instant.now(), ZoneOffset.UTC)

    dsl.update(PARKING_SPACES)
      .set(PARKING_SPACES.STATUS, "AVAILABLE")
      .set(PARKING_SPACES.UPDATED_AT, now)
      .where(PARKING_SPACES.ID.in(
        dsl.select(RESERVATIONS.SPACE_ID).from(RESERVATIONS)
          .where(RESERVATIONS.STATUS.in("PENDING", "CONFIRMED"))
          .and(RESERVATIONS.END_TIME.lt(now))
      ))
      .execute()

    val updatedCount = dsl.update(RESERVATIONS)
      .set(RESERVATIONS.STATUS, "EXPIRED")
      .set(RESERVATIONS.UPDATED_AT, now)
      .where(RESERVATIONS.STATUS.eq("PENDING").or(RESERVATIONS.STATUS.eq("CONFIRMED")))
      .and(RESERVATIONS.END_TIME.lt(now))
      .execute()

    if (updatedCount > 0) {
      redisService.foreach(_.del("dashboard:stats"))
      wsService.broadcast("""{"event":"dashboard_updated"}""")
    }
  }
}
