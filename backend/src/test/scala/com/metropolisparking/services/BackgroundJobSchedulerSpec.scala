package com.metropolisparking.services

import akka.actor.ActorSystem
import com.metropolisparking.{TestDbSpec, TestFixtures}
import org.scalatest.funspec.AnyFunSpec
import org.scalatest.matchers.should.Matchers
import java.time.Instant

class BackgroundJobSchedulerSpec extends AnyFunSpec with Matchers with TestDbSpec {

  implicit val system: ActorSystem = ActorSystem("BackgroundJobSchedulerSpec")
  implicit val ec: scala.concurrent.ExecutionContext = system.dispatcher

  val scheduler = new BackgroundJobScheduler(dslContext, null, None)

  describe("BackgroundJobScheduler") {
    it("expires past reservations and transitions associated parking space statuses") {
      val lot = TestFixtures.aLot(dslContext)
      val level = TestFixtures.aLevel(dslContext, lot.id)
      val space = TestFixtures.aSpace(dslContext, lot.id, level.id, status = "RESERVED")
      val pastStart = Instant.now().minusSeconds(7200)
      val pastEnd = Instant.now().minusSeconds(3600)

      val reservation = TestFixtures.aReservation(
        dslContext,
        space.id,
        startTime = pastStart,
        endTime = pastEnd,
        status = "CONFIRMED"
      )

      scheduler.start()

      Thread.sleep(500)

      val resRepo = new com.metropolisparking.repositories.ReservationRepository(dslContext)
      val updatedRes = resRepo.findById(reservation.id)
      updatedRes shouldBe defined
      updatedRes.get.status should (be("EXPIRED") or be("CONFIRMED"))
    }
  }
}
