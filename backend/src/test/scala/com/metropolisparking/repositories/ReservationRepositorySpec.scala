package com.metropolisparking.repositories

import com.metropolisparking.{TestDbSpec, TestFixtures}
import com.metropolisparking.models.Reservation
import org.scalatest.funspec.AnyFunSpec
import org.scalatest.matchers.should.Matchers
import java.time.Instant
import java.util.UUID

class ReservationRepositorySpec extends AnyFunSpec with Matchers with TestDbSpec {

  val repo = new ReservationRepository(dslContext)

  describe("ReservationRepository") {
    it("creates, checks overlapping windows, and updates reservation status") {
      val lot = TestFixtures.aLot(dslContext)
      val level = TestFixtures.aLevel(dslContext, lot.id)
      val space = TestFixtures.aSpace(dslContext, lot.id, level.id)
      val user = TestFixtures.aUser(dslContext)

      val start = Instant.now().plusSeconds(3600)
      val end = start.plusSeconds(3600)

      val res = Reservation(
        id = UUID.randomUUID(),
        userId = user.id,
        spaceId = space.id,
        startTime = start,
        endTime = end,
        status = "CONFIRMED",
        fee = BigDecimal("20.00"),
        createdAt = Instant.now(),
        updatedAt = Instant.now()
      )

      repo.create(res)

      val hasOverlap = repo.hasOverlapping(space.id, start.plusSeconds(300), end.minusSeconds(300))
      hasOverlap shouldBe true

      val noOverlap = repo.hasOverlapping(space.id, end.plusSeconds(100), end.plusSeconds(3600))
      noOverlap shouldBe false

      val activeRes = repo.findActiveBySpaceId(space.id)
      activeRes shouldBe defined
      activeRes.get.id shouldBe res.id

      val userResList = repo.listByUserId(user.id)
      userResList.exists(_.id == res.id) shouldBe true

      val cancelled = res.copy(status = "CANCELLED")
      repo.update(cancelled)

      val fetchedCancelled = repo.findById(res.id)
      fetchedCancelled.get.status shouldBe "CANCELLED"
    }
  }
}
