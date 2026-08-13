package com.metropolisparking.services

import com.metropolisparking.{TestDbSpec, TestFixtures}
import com.metropolisparking.dto.ParkingLotCreateRequest
import com.metropolisparking.dto.ParkingSpaceCreateRequest
import com.metropolisparking.exceptions.{ConflictException, NotFoundException, ValidationException}
import com.metropolisparking.repositories._
import org.scalatest.funspec.AnyFunSpec
import org.scalatest.matchers.should.Matchers
import java.util.UUID

class ParkingLotServiceSpec extends AnyFunSpec with Matchers with TestDbSpec {

  val lotRepo = new ParkingLotRepository(dslContext)
  val sessionRepo = new ParkingSessionRepository(dslContext)
  val reservationRepo = new ReservationRepository(dslContext)
  val vehicleRepo = new VehicleRepository(dslContext)
  val userRepo = new UserRepository(dslContext)
  val auditLogRepo = new AuditLogRepository(dslContext)
  val auditLogService = new AuditLogService(auditLogRepo)

  val lotService = new ParkingLotService(
    repo = lotRepo,
    auditLogService = auditLogService,
    sessionRepo = sessionRepo,
    reservationRepo = reservationRepo,
    vehicleRepo = vehicleRepo,
    userRepo = userRepo,
    wsService = null
  )

  describe("ParkingLotService") {
    it("creates, retrieves, updates, and soft deletes a parking lot") {
      val created = lotService.createLot(ParkingLotCreateRequest("Central Plaza", "Main St"), None)
      created.name shouldBe "Central Plaza"

      val fetched = lotService.getLot(created.id)
      fetched shouldBe defined
      fetched.get.location shouldBe "Main St"

      val updated = lotService.updateLot(created.id, ParkingLotCreateRequest("Central Plaza North", "Main St 101"), None)
      updated.name shouldBe "Central Plaza North"

      val list = lotService.listLots()
      list.exists(_.id == created.id) shouldBe true

      val deleted = lotService.deleteLot(created.id, None)
      deleted shouldBe true

      lotService.getLot(created.id) shouldBe None
    }

    it("throws ValidationException for invalid lot parameters") {
      intercept[ValidationException] {
        lotService.createLot(ParkingLotCreateRequest("A", "Main St"), None)
      }
    }

    it("throws NotFoundException when updating non-existent lot") {
      intercept[NotFoundException] {
        lotService.updateLot(UUID.randomUUID(), ParkingLotCreateRequest("Valid Name", "Valid Location"), None)
      }
    }

    it("creates and lists levels for a lot") {
      val lot = TestFixtures.aLot(dslContext)
      val level1 = lotService.createLevel(lot.id, 1, None)
      level1.levelNumber shouldBe 1

      val levels = lotService.listLevels(lot.id)
      levels.map(_.levelNumber) should contain(1)
    }

    it("throws ConflictException on duplicate level creation") {
      val lot = TestFixtures.aLot(dslContext)
      lotService.createLevel(lot.id, 1, None)

      intercept[ConflictException] {
        lotService.createLevel(lot.id, 1, None)
      }
    }

    it("creates, updates, and retrieves parking space details") {
      val lot = TestFixtures.aLot(dslContext)
      val level = TestFixtures.aLevel(dslContext, lot.id)

      val space = lotService.createSpace(ParkingSpaceCreateRequest(lot.id, level.id, "B-201", "CAR"), None)
      space.spaceNumber shouldBe "B-201"
      space.status shouldBe "AVAILABLE"

      val updatedStatus = lotService.updateSpaceStatus(space.id, "OUT_OF_SERVICE", None)
      updatedStatus.status shouldBe "OUT_OF_SERVICE"

      val details = lotService.getSpaceDetails(space.id)
      details.spaceNumber shouldBe "B-201"
      details.status shouldBe "OUT_OF_SERVICE"
      details.activeSession shouldBe None
      details.activeReservation shouldBe None
    }

    it("populates active session details when space status is OCCUPIED") {
      val lot = TestFixtures.aLot(dslContext)
      val level = TestFixtures.aLevel(dslContext, lot.id)
      val space = TestFixtures.aSpace(dslContext, lot.id, level.id, status = "OCCUPIED")
      val session = TestFixtures.aSession(dslContext, space.id, plateNumber = "MH12XY9999")

      val details = lotService.getSpaceDetails(space.id)
      details.status shouldBe "OCCUPIED"
      details.activeSession shouldBe defined
      details.activeSession.get.plateNumber shouldBe "MH12XY9999"
    }

    it("populates active reservation details when space status is RESERVED") {
      val lot = TestFixtures.aLot(dslContext)
      val level = TestFixtures.aLevel(dslContext, lot.id)
      val space = TestFixtures.aSpace(dslContext, lot.id, level.id, status = "RESERVED")
      val user = TestFixtures.aUser(dslContext, name = "John Reserver")
      TestFixtures.aReservation(dslContext, space.id, userId = Some(user.id))

      val details = lotService.getSpaceDetails(space.id)
      details.status shouldBe "RESERVED"
      details.activeReservation shouldBe defined
      details.activeReservation.get.customerName shouldBe "John Reserver"
    }
  }
}
