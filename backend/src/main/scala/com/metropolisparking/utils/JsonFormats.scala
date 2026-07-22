package com.metropolisparking.utils

import com.metropolisparking.models._
import spray.json.{DefaultJsonProtocol, DeserializationException, JsString, JsValue, RootJsonFormat}
import java.time.format.DateTimeFormatter
import java.time.{Instant, LocalDateTime, ZonedDateTime}
import java.util.UUID

object JsonFormats extends DefaultJsonProtocol {
  implicit val uuidFormat: RootJsonFormat[UUID] = new RootJsonFormat[UUID] {
    def write(obj: UUID): JsValue = JsString(obj.toString)
    def read(json: JsValue): UUID = json match {
      case JsString(uuid) => UUID.fromString(uuid)
      case _              => throw DeserializationException("Expected UUID as string")
    }
  }

  implicit val instantFormat: RootJsonFormat[Instant] = new RootJsonFormat[Instant] {
    def write(obj: Instant): JsValue = JsString(obj.toString)
    def read(json: JsValue): Instant = json match {
      case JsString(raw) => Instant.parse(raw)
      case _             => throw DeserializationException("Expected ISO Instant as string")
    }
  }

  implicit val zonedDateTimeFormat: RootJsonFormat[ZonedDateTime] = new RootJsonFormat[ZonedDateTime] {
    private val formatter = DateTimeFormatter.ISO_ZONED_DATE_TIME
    def write(obj: ZonedDateTime): JsValue = JsString(obj.format(formatter))
    def read(json: JsValue): ZonedDateTime = json match {
      case JsString(raw) => ZonedDateTime.parse(raw, formatter)
      case _             => throw DeserializationException("Expected ISO ZonedDateTime as string")
    }
  }

  implicit val localDateTimeFormat: RootJsonFormat[LocalDateTime] = new RootJsonFormat[LocalDateTime] {
    private val formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME
    def write(obj: LocalDateTime): JsValue = JsString(obj.format(formatter))
    def read(json: JsValue): LocalDateTime = json match {
      case JsString(raw) => LocalDateTime.parse(raw, formatter)
      case _             => throw DeserializationException("Expected ISO LocalDateTime as string")
    }
  }

  implicit val userFormat: RootJsonFormat[User] = jsonFormat5(User)
  implicit val vehicleFormat: RootJsonFormat[Vehicle] = jsonFormat5(Vehicle)
  implicit val parkingLotFormat: RootJsonFormat[ParkingLot] = jsonFormat4(ParkingLot)
  implicit val parkingLevelFormat: RootJsonFormat[ParkingLevel] = jsonFormat3(ParkingLevel)
  implicit val parkingSpaceFormat: RootJsonFormat[ParkingSpace] = jsonFormat7(ParkingSpace)
  implicit val parkingSessionFormat: RootJsonFormat[ParkingSession] = jsonFormat7(ParkingSession)
  implicit val paymentFormat: RootJsonFormat[Payment] = jsonFormat5(Payment)
  implicit val pricingRuleFormat: RootJsonFormat[PricingRule] = jsonFormat5(PricingRule)
  implicit val auditLogFormat: RootJsonFormat[AuditLog] = jsonFormat7(AuditLog)
}
