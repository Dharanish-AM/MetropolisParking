package com.metropolisparking.repositories

import com.metropolisparking.{TestDbSpec, TestFixtures}
import com.metropolisparking.models.{ParkingLevel, ParkingLot, ParkingSpace}
import org.scalatest.funspec.AnyFunSpec
import org.scalatest.matchers.should.Matchers
import java.util.UUID

class ParkingLotRepositorySpec extends AnyFunSpec with Matchers with TestDbSpec {

  val repo = new ParkingLotRepository(dslContext)

  describe("ParkingLotRepository") {
    it("creates, reads, updates, and soft deletes a parking lot") {
      val lot = ParkingLot(UUID.randomUUID(), "Repo Test Lot", "123 Test St")
      repo.create(lot)

      val fetched = repo.findById(lot.id)
      fetched shouldBe defined
      fetched.get.name shouldBe "Repo Test Lot"

      val updated = lot.copy(name = "Updated Repo Lot")
      repo.update(updated)

      val fetchedUpdated = repo.findById(lot.id)
      fetchedUpdated.get.name shouldBe "Updated Repo Lot"

      val list = repo.list()
      list.exists(_.id == lot.id) shouldBe true

      val deleted = repo.delete(lot.id)
      deleted shouldBe true

      repo.findById(lot.id) shouldBe None
    }

    it("creates and retrieves parking levels") {
      val lot = TestFixtures.aLot(dslContext)
      val level = ParkingLevel(UUID.randomUUID(), lot.id, 2)
      repo.createLevel(level)

      val levels = repo.listLevels(lot.id)
      levels.map(_.levelNumber) should contain(2)

      val found = repo.findLevel(lot.id, 2)
      found shouldBe defined
      found.get.id shouldBe level.id
    }

    it("creates, queries, updates, and soft deletes parking spaces") {
      val lot = TestFixtures.aLot(dslContext)
      val level = TestFixtures.aLevel(dslContext, lot.id)
      val space = ParkingSpace(UUID.randomUUID(), lot.id, level.id, "SPEC-101", "CAR", "AVAILABLE")

      repo.createSpace(space)

      val foundSpace = repo.findSpaceById(space.id)
      foundSpace shouldBe defined
      foundSpace.get.spaceNumber shouldBe "SPEC-101"

      val updatedSpace = space.copy(status = "OCCUPIED")
      repo.updateSpace(updatedSpace)

      val foundUpdated = repo.findSpaceById(space.id)
      foundUpdated.get.status shouldBe "OCCUPIED"

      val spacesByLot = repo.listSpaces(Some(lot.id), None)
      spacesByLot.map(_.id) should contain(space.id)

      val deleted = repo.deleteSpace(space.id)
      deleted shouldBe true

      repo.findSpaceById(space.id) shouldBe None
    }
  }
}
