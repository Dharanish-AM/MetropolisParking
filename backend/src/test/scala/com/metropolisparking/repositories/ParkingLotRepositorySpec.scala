package com.metropolisparking.repositories

import com.metropolisparking.{TestDbSpec, TestFixtures}
import com.metropolisparking.models.{ParkingLevel, ParkingLot, ParkingSpace}
import org.scalatest.funspec.AnyFunSpec
import org.scalatest.matchers.should.Matchers
import java.util.UUID

class ParkingLotRepositorySpec extends AnyFunSpec with Matchers with TestDbSpec {

  val repo = new ParkingLotRepository(dslContext)

  describe("ParkingLotRepository") {
    it("creates, retrieves by ID, lists, updates, and soft deletes parking lots") {
      val lot = ParkingLot(UUID.randomUUID(), "Repo Test Lot", "123 Repo St")
      repo.create(lot)

      val fetched = repo.findById(lot.id)
      fetched shouldBe defined
      fetched.get.name shouldBe "Repo Test Lot"

      val list = repo.list()
      list.exists(_.id == lot.id) shouldBe true

      val updated = lot.copy(name = "Repo Test Lot Updated")
      repo.update(updated)
      repo.findById(lot.id).get.name shouldBe "Repo Test Lot Updated"

      val deleted = repo.delete(lot.id)
      deleted shouldBe true
      repo.findById(lot.id) shouldBe None
    }

    it("creates, finds, and lists levels for a lot") {
      val lot = TestFixtures.aLot(dslContext)
      val level = ParkingLevel(UUID.randomUUID(), lot.id, 5)
      repo.createLevel(level)

      val fetchedLevel = repo.findLevel(lot.id, 5)
      fetchedLevel shouldBe defined
      fetchedLevel.get.id shouldBe level.id

      val levels = repo.listLevels(lot.id)
      levels.map(_.levelNumber) should contain(5)
    }

    it("creates, retrieves, lists, updates, and soft deletes parking spaces") {
      val lot = TestFixtures.aLot(dslContext)
      val level = TestFixtures.aLevel(dslContext, lot.id)
      val space = ParkingSpace(UUID.randomUUID(), lot.id, level.id, "REPO-101", "CAR", "AVAILABLE")
      repo.createSpace(space)

      val fetchedSpace = repo.findSpaceById(space.id)
      fetchedSpace shouldBe defined
      fetchedSpace.get.spaceNumber shouldBe "REPO-101"

      val spaces = repo.listSpaces(Some(lot.id), Some(level.id))
      spaces.exists(_.id == space.id) shouldBe true

      val updatedSpace = space.copy(status = "OCCUPIED")
      repo.updateSpace(updatedSpace)
      repo.findSpaceById(space.id).get.status shouldBe "OCCUPIED"

      val deletedSpace = repo.deleteSpace(space.id)
      deletedSpace shouldBe true
      repo.findSpaceById(space.id) shouldBe None
    }
  }
}
