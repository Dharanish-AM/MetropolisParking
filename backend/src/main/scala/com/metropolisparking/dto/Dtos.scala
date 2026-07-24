package com.metropolisparking.dto

import com.metropolisparking.utils.JsonFormats._
import spray.json.RootJsonFormat
import java.util.UUID

case class LoginRequest(email: String, password: String)
case class UserResponse(id: UUID, name: String, email: String, role: String)
case class LoginResponse(token: String, user: UserResponse)
case class UserRegistrationRequest(name: String, email: String, password: Option[String] = None, role: String)

case class ParkingLotCreateRequest(name: String, location: String)
case class ParkingSpaceCreateRequest(lotId: UUID, levelId: UUID, spaceNumber: String, `type`: String)
case class VehicleCreateRequest(plateNumber: String, `type`: String, ownerId: Option[UUID])
case class LevelCreateRequest(levelNumber: Int)

case class SessionStartRequest(plateNumber: String, spaceId: UUID)
case class SessionEndRequest(plateNumber: String)
case class PaymentProcessRequest(method: String)

case class OccupancyStats(totalSpaces: Int, occupiedSpaces: Int, availableSpaces: Int, occupancyRate: Double)
case class FinancialStats(totalRevenue: BigDecimal, revenueByMethod: Map[String, BigDecimal])
case class SessionDetail(id: UUID, plateNumber: String, spaceNumber: String, entryTime: String, status: String)
case class DashboardStats(occupancy: OccupancyStats, financial: FinancialStats, recentSessions: List[SessionDetail])

case class ReservationCreateRequest(spaceId: UUID, startTime: String, endTime: String)
case class ReservationResponse(
  id: UUID,
  userId: UUID,
  spaceId: UUID,
  spaceNumber: String,
  lotName: String,
  startTime: String,
  endTime: String,
  status: String,
  fee: BigDecimal
)

case class AnprEntryRequest(plateNumber: String, lotId: UUID)
case class AnprExitRequest(plateNumber: String)
case class AnprEntryResponse(sessionId: UUID, plateNumber: String, spaceNumber: String, levelNumber: Int, entryTime: String)
case class AnprExitResponse(sessionId: UUID, plateNumber: String, durationMinutes: Long, fee: BigDecimal, paymentStatus: String)

case class QrGenerateResponse(qrToken: String, payload: String)
case class QrScanRequest(qrToken: String)
case class QrScanResponse(action: String, entityId: UUID, entityType: String, plateNumber: String, spaceNumber: String, status: String, message: String)

object DtoFormats {
  implicit val loginRequestFormat: RootJsonFormat[LoginRequest] = jsonFormat2(LoginRequest)
  implicit val userResponseFormat: RootJsonFormat[UserResponse] = jsonFormat4(UserResponse)
  implicit val loginResponseFormat: RootJsonFormat[LoginResponse] = jsonFormat2(LoginResponse)
  implicit val userRegistrationRequestFormat: RootJsonFormat[UserRegistrationRequest] = jsonFormat4(UserRegistrationRequest)

  implicit val parkingLotCreateRequestFormat: RootJsonFormat[ParkingLotCreateRequest] = jsonFormat2(ParkingLotCreateRequest)
  implicit val parkingSpaceCreateRequestFormat: RootJsonFormat[ParkingSpaceCreateRequest] = jsonFormat4(ParkingSpaceCreateRequest)
  implicit val vehicleCreateRequestFormat: RootJsonFormat[VehicleCreateRequest] = jsonFormat3(VehicleCreateRequest)
  implicit val levelCreateRequestFormat: RootJsonFormat[LevelCreateRequest] = jsonFormat1(LevelCreateRequest)

  implicit val sessionStartRequestFormat: RootJsonFormat[SessionStartRequest] = jsonFormat2(SessionStartRequest)
  implicit val sessionEndRequestFormat: RootJsonFormat[SessionEndRequest] = jsonFormat1(SessionEndRequest)
  implicit val paymentProcessRequestFormat: RootJsonFormat[PaymentProcessRequest] = jsonFormat1(PaymentProcessRequest)

  implicit val occupancyStatsFormat: RootJsonFormat[OccupancyStats] = jsonFormat4(OccupancyStats)
  implicit val financialStatsFormat: RootJsonFormat[FinancialStats] = jsonFormat2(FinancialStats)
  implicit val sessionDetailFormat: RootJsonFormat[SessionDetail] = jsonFormat5(SessionDetail)
  implicit val dashboardStatsFormat: RootJsonFormat[DashboardStats] = jsonFormat3(DashboardStats)

  implicit val reservationCreateRequestFormat: RootJsonFormat[ReservationCreateRequest] = jsonFormat3(ReservationCreateRequest)
  implicit val reservationResponseFormat: RootJsonFormat[ReservationResponse] = jsonFormat9(ReservationResponse)

  implicit val anprEntryRequestFormat: RootJsonFormat[AnprEntryRequest] = jsonFormat2(AnprEntryRequest)
  implicit val anprExitRequestFormat: RootJsonFormat[AnprExitRequest] = jsonFormat1(AnprExitRequest)
  implicit val anprEntryResponseFormat: RootJsonFormat[AnprEntryResponse] = jsonFormat5(AnprEntryResponse)
  implicit val anprExitResponseFormat: RootJsonFormat[AnprExitResponse] = jsonFormat5(AnprExitResponse)

  implicit val qrGenerateResponseFormat: RootJsonFormat[QrGenerateResponse] = jsonFormat2(QrGenerateResponse)
  implicit val qrScanRequestFormat: RootJsonFormat[QrScanRequest] = jsonFormat1(QrScanRequest)
  implicit val qrScanResponseFormat: RootJsonFormat[QrScanResponse] = jsonFormat7(QrScanResponse)
}
