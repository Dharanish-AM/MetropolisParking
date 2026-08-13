package com.metropolisparking.repositories

import com.metropolisparking.{TestDbSpec, TestFixtures}
import com.metropolisparking.models.ParkingSession
import org.scalatest.funspec.AnyFunSpec
import org.scalatest.matchers.should.Matchers
import java.time.Instant
import java.util.UUID

class ParkingSessionRepositorySpec extends AnyFunSpec with Matchers with TestDbSpec {

  val repo = new ParkingSessionRepository(dslContext)

  describe("ParkingSessionRepository") {
    it("creates, queries active sessions, and updates exit parameters") {
      val lot = TestFixtures.aLot(dslContext)
      val level = TestFixtures.aLevel(dslContext, lot.id)
      val space = TestFixtures.aSpace(dslContext, lot.id, level.id)
      val vehicle = TestFixtures.aVehicle(dslContext, plateNumber = "MH12SESS99")

      val session = ParkingSession(UUID.randomUUID(), vehicle.id, space.id, Instant.now())
      repo.create(session)

      val activeByVehicle = repo.findActiveByVehicleId(vehicle.id)
      activeByVehicle shouldBe defined
      activeByVehicle.get.id shouldBe session.id

      val activeBySpace = repo.findActiveBySpaceId(space.id)
      activeBySpace shouldBe defined
      activeBySpace.get.id shouldBe session.id

      val exitTime = Instant.now().plusSeconds(3600)
      val updated = session.copy(
        exitTime = Some(exitTime),
        durationMinutes = Some(60),
        fee = Some(BigDecimal("15.00"))
      )
      repo.update(updated)

      val endedSession = repo.findById(session.id)
      endedSession shouldBe defined
      endedSession.get.exitTime shouldBe defined
      endedSession.get.fee shouldBe Some(BigDecimal("15.00"))

      val activeList = repo.list(activeOnly = true)
      activeList.exists(_.id == session.id) shouldBe false

      val allList = repo.list(activeOnly = false)
      allList.exists(_.id == session.id) shouldBe true
    }
  }
}
