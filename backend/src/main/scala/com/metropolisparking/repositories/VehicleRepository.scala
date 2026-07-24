package com.metropolisparking.repositories

import com.metropolisparking.jooq.Tables.VEHICLES
import com.metropolisparking.models.Vehicle
import org.jooq.DSLContext
import java.util.UUID
import scala.jdk.CollectionConverters._

class VehicleRepository(dsl: DSLContext) extends BaseRepository(dsl) {
  def create(vehicle: Vehicle): Vehicle = {
    dsl.insertInto(VEHICLES)
      .set(VEHICLES.ID, vehicle.id)
      .set(VEHICLES.PLATE_NUMBER, vehicle.plateNumber)
      .set(VEHICLES.TYPE, vehicle.`type`)
      .set(VEHICLES.OWNER_ID, vehicle.ownerId.orNull)
      .execute()
    vehicle
  }

  def findByPlateNumber(plateNumber: String): Option[Vehicle] = {
    Option(
      dsl.selectFrom(VEHICLES)
        .where(VEHICLES.PLATE_NUMBER.eq(plateNumber).and(VEHICLES.DELETED_AT.isNull))
        .fetchOne()
    ).map { r =>
      Vehicle(
        id = r.getId,
        plateNumber = r.getPlateNumber,
        `type` = r.getType,
        ownerId = Option(r.getOwnerId)
      )
    }
  }

  def findById(id: UUID): Option[Vehicle] = {
    Option(
      dsl.selectFrom(VEHICLES)
        .where(VEHICLES.ID.eq(id).and(VEHICLES.DELETED_AT.isNull))
        .fetchOne()
    ).map { r =>
      Vehicle(
        id = r.getId,
        plateNumber = r.getPlateNumber,
        `type` = r.getType,
        ownerId = Option(r.getOwnerId)
      )
    }
  }

  def list(): List[Vehicle] = {
    dsl.selectFrom(VEHICLES)
      .where(VEHICLES.DELETED_AT.isNull)
      .fetch().asScala.map { r =>
        Vehicle(
          id = r.getId,
          plateNumber = r.getPlateNumber,
          `type` = r.getType,
          ownerId = Option(r.getOwnerId)
        )
      }.toList
  }
}
