package com.metropolisparking.services

import com.metropolisparking.{TestDbSpec, TestFixtures}
import com.metropolisparking.dto.ReservationCreateRequest
import com.metropolisparking.exceptions.{ConflictException, NotFoundException, ValidationException}
import com.metropolisparking.repositories._
import org.scalatest.funspec.AnyFunSpec
import org.scalatest.matchers.should.Matchers
import java.time.Instant

class ReservationServiceSpec extends AnyFunSpec with Matchers with TestDbSpec {

  val lotRepo         = new ParkingLotRepository(dslContext)
  val userRepo        = new UserRepository(dslContext)
  val pricingRuleRepo = new PricingRuleRepository(dslContext)
  val auditLogRepo    = new AuditLogRepository(dslContext)
  val reservationRepo = new ReservationRepository(dslContext)

  val auditLogService    = new AuditLogService(auditLogRepo)
  val reservationService = new ReservationService(reservationRepo, lotRepo, pricingRuleRepo, auditLogService, null)

  describe("ReservationService") {
    it("makes a reservation successfully when space is available") {
      val lot = TestFixtures.aLot(dslContext)
      val level = TestFixtures.aLevel(dslContext, lot.id)
      val space = TestFixtures.aSpace(dslContext, lot.id, level.id)
      val user = TestFixtures.aUser(dslContext, "CUSTOMER")

      val start = Instant.now().plusSeconds(300).toString
      val end = Instant.now().plusSeconds(3900).toString

      val req = ReservationCreateRequest(space.id, start, end, "CAR")
      val res = reservationService.makeReservation(req, user.id)

      res.status shouldBe "CONFIRMED"
      res.spaceId shouldBe space.id
    }

    it("throws ConflictException when creating overlapping reservation for same space") {
      val lot = TestFixtures.aLot(dslContext)
      val level = TestFixtures.aLevel(dslContext, lot.id)
      val space = TestFixtures.aSpace(dslContext, lot.id, level.id)
      val user = TestFixtures.aUser(dslContext, "CUSTOMER")

      val start = Instant.now().plusSeconds(300)
      val end = Instant.now().plusSeconds(3900)
      TestFixtures.aReservation(dslContext, space.id, Some(user.id), start, end)

      val req = ReservationCreateRequest(space.id, start.plusSeconds(300).toString, end.plusSeconds(300).toString, "CAR")
      intercept[ConflictException] {
        reservationService.makeReservation(req, user.id)
      }
    }

    it("succeeds for adjacent non-overlapping time windows") {
      val lot = TestFixtures.aLot(dslContext)
      val level = TestFixtures.aLevel(dslContext, lot.id)
      val space = TestFixtures.aSpace(dslContext, lot.id, level.id)
      val user = TestFixtures.aUser(dslContext, "CUSTOMER")

      val t1 = Instant.now().plusSeconds(300)
      val t2 = Instant.now().plusSeconds(3900)
      val t3 = Instant.now().plusSeconds(7500)

      TestFixtures.aReservation(dslContext, space.id, Some(user.id), t1, t2)

      val req = ReservationCreateRequest(space.id, t2.toString, t3.toString, "CAR")
      val res = reservationService.makeReservation(req, user.id)
      res.status shouldBe "CONFIRMED"
    }

    it("cancels a confirmed reservation successfully") {
      val lot = TestFixtures.aLot(dslContext)
      val level = TestFixtures.aLevel(dslContext, lot.id)
      val space = TestFixtures.aSpace(dslContext, lot.id, level.id)
      val user = TestFixtures.aUser(dslContext, "CUSTOMER")

      val reservation = TestFixtures.aReservation(dslContext, space.id, Some(user.id))
      reservationService.cancelReservation(reservation.id, user.id, "CUSTOMER")

      val updated = reservationRepo.findById(reservation.id).get
      updated.status shouldBe "CANCELLED"
    }

    it("prevents CUSTOMER from cancelling another user's reservation") {
      val lot = TestFixtures.aLot(dslContext)
      val level = TestFixtures.aLevel(dslContext, lot.id)
      val space = TestFixtures.aSpace(dslContext, lot.id, level.id)
      val owner = TestFixtures.aUser(dslContext, "CUSTOMER")
      val otherUser = TestFixtures.aUser(dslContext, "CUSTOMER")

      val reservation = TestFixtures.aReservation(dslContext, space.id, Some(owner.id))

      intercept[ValidationException] {
        reservationService.cancelReservation(reservation.id, otherUser.id, "CUSTOMER")
      }

      // ADMIN can cancel any user's reservation
      reservationService.cancelReservation(reservation.id, otherUser.id, "ADMIN")
      val updated = reservationRepo.findById(reservation.id).get
      updated.status shouldBe "CANCELLED"
    }

    it("throws ConflictException when cancelling an already cancelled reservation") {
      val lot = TestFixtures.aLot(dslContext)
      val level = TestFixtures.aLevel(dslContext, lot.id)
      val space = TestFixtures.aSpace(dslContext, lot.id, level.id)
      val user = TestFixtures.aUser(dslContext, "CUSTOMER")

      val reservation = TestFixtures.aReservation(dslContext, space.id, Some(user.id), status = "CANCELLED")

      intercept[ConflictException] {
        reservationService.cancelReservation(reservation.id, user.id, "CUSTOMER")
      }
    }
  }
}
