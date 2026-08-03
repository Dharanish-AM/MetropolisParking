package com.metropolisparking.services

import com.metropolisparking.{TestDbSpec, TestFixtures}
import com.metropolisparking.dto.VehicleCreateRequest
import com.metropolisparking.exceptions.{ConflictException, ValidationException}
import com.metropolisparking.repositories._
import org.scalatest.funspec.AnyFunSpec
import org.scalatest.matchers.should.Matchers
import java.util.UUID

class VehicleServiceSpec extends AnyFunSpec with Matchers with TestDbSpec {

  val vehicleRepo  = new VehicleRepository(dslContext)
  val auditLogRepo = new AuditLogRepository(dslContext)

  val auditLogService = new AuditLogService(auditLogRepo)
  val vehicleService  = new VehicleService(vehicleRepo, auditLogService)

  describe("VehicleService") {
    it("registers a vehicle successfully with uppercase clean plate number") {
      val req = VehicleCreateRequest("mh 12 ab 1234", "CAR", None)
      val vehicle = vehicleService.register(req, None)

      vehicle.plateNumber shouldBe "MH12AB1234"
      vehicle.`type` shouldBe "CAR"
    }

    it("throws ConflictException when registering duplicate plate number") {
      val req = VehicleCreateRequest("MH12AB1234", "CAR", None)
      vehicleService.register(req, None)

      intercept[ConflictException] {
        vehicleService.register(req, None)
      }
    }

    it("throws ValidationException for invalid plate number format") {
      val req = VehicleCreateRequest("INVALID!@#", "CAR", None)
      intercept[ValidationException] {
        vehicleService.register(req, None)
      }
    }

    it("fetches vehicle by plate number") {
      val req = VehicleCreateRequest("KA01CD5678", "SUV", None)
      vehicleService.register(req, None)

      val fetched = vehicleService.getByPlateNumber("ka 01 cd 5678")
      fetched shouldBe defined
      fetched.get.plateNumber shouldBe "KA01CD5678"
    }

    it("lists registered vehicles") {
      vehicleService.register(VehicleCreateRequest("DL01EF9012", "BIKE", None), None)

      val list = vehicleService.list()
      list should not be empty
    }
  }
}
