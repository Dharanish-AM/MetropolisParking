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
case class SessionDetail(
  id: UUID,
  plateNumber: String,
  spaceNumber: String,
  startTime: String,
  endTime: Option[String],
  fee: Option[BigDecimal],
  status: String
)
case class DashboardStats(occupancy: OccupancyStats, financial: FinancialStats, recentSessions: List[SessionDetail])

case class ReservationCreateRequest(spaceId: UUID, startTime: String, endTime: String, vehicleType: String)
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

case class ActiveSessionDetails(
  id: UUID,
  vehicleId: UUID,
  plateNumber: String,
  vehicleType: String,
  entryTime: String,
  customerName: Option[String],
  customerEmail: Option[String]
)

case class ActiveReservationDetails(
  id: UUID,
  userId: UUID,
  customerName: String,
  customerEmail: String,
  startTime: String,
  endTime: String,
  status: String,
  fee: BigDecimal
)

case class SpaceDetailsResponse(
  spaceId: UUID,
  spaceNumber: String,
  `type`: String,
  status: String,
  activeSession: Option[ActiveSessionDetails],
  activeReservation: Option[ActiveReservationDetails]
)

case class PricingRuleCreateRequest(
  ruleType: String,
  rate: BigDecimal,
  vehicleType: Option[String],
  lotId: Option[UUID],
  startHour: Option[Int],
  endHour: Option[Int],
  occupancyThreshold: Option[Int],
  surgeMultiplier: Option[BigDecimal],
  minFee: Option[BigDecimal],
  maxDailyCap: Option[BigDecimal]
)

case class PricingCalculateRequest(
  lotId: UUID,
  vehicleType: String,
  entryTime: String,
  exitTime: String
)

case class PricingCalculateResponse(
  durationMinutes: Long,
  baseFee: BigDecimal,
  surgeMultiplier: BigDecimal,
  finalFee: BigDecimal,
  appliedRuleType: String
)

case class RevenueSummary(
  totalRevenue: BigDecimal,
  todayRevenue: BigDecimal,
  totalSessions: Long,
  avgSessionFee: BigDecimal
)

case class LotRevenueItem(
  lotId: UUID,
  lotName: String,
  totalRevenue: BigDecimal,
  sessionCount: Long
)

case class VehicleTypeRevenueItem(
  vehicleType: String,
  totalRevenue: BigDecimal,
  percentage: Double
)

case class RevenueTrendPoint(
  date: String,
  revenue: BigDecimal,
  sessionCount: Long
)

case class AnalyticsResponse(
  summary: RevenueSummary,
  lotBreakdown: List[LotRevenueItem],
  vehicleBreakdown: List[VehicleTypeRevenueItem],
  trendPoints: List[RevenueTrendPoint]
)

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
  implicit val sessionDetailFormat: RootJsonFormat[SessionDetail] = jsonFormat7(SessionDetail)
  implicit val dashboardStatsFormat: RootJsonFormat[DashboardStats] = jsonFormat3(DashboardStats)

  implicit val reservationCreateRequestFormat: RootJsonFormat[ReservationCreateRequest] = jsonFormat4(ReservationCreateRequest)
  implicit val reservationResponseFormat: RootJsonFormat[ReservationResponse] = jsonFormat9(ReservationResponse)

  implicit val anprEntryRequestFormat: RootJsonFormat[AnprEntryRequest] = jsonFormat2(AnprEntryRequest)
  implicit val anprExitRequestFormat: RootJsonFormat[AnprExitRequest] = jsonFormat1(AnprExitRequest)
  implicit val anprEntryResponseFormat: RootJsonFormat[AnprEntryResponse] = jsonFormat5(AnprEntryResponse)
  implicit val anprExitResponseFormat: RootJsonFormat[AnprExitResponse] = jsonFormat5(AnprExitResponse)

  implicit val qrGenerateResponseFormat: RootJsonFormat[QrGenerateResponse] = jsonFormat2(QrGenerateResponse)
  implicit val qrScanRequestFormat: RootJsonFormat[QrScanRequest] = jsonFormat1(QrScanRequest)
  implicit val qrScanResponseFormat: RootJsonFormat[QrScanResponse] = jsonFormat7(QrScanResponse)

  implicit val activeSessionDetailsFormat: RootJsonFormat[ActiveSessionDetails] = jsonFormat7(ActiveSessionDetails)
  implicit val activeReservationDetailsFormat: RootJsonFormat[ActiveReservationDetails] = jsonFormat8(ActiveReservationDetails)
  implicit val spaceDetailsResponseFormat: RootJsonFormat[SpaceDetailsResponse] = jsonFormat6(SpaceDetailsResponse)

  implicit val pricingRuleCreateRequestFormat: RootJsonFormat[PricingRuleCreateRequest] = jsonFormat10(PricingRuleCreateRequest)
  implicit val pricingCalculateRequestFormat: RootJsonFormat[PricingCalculateRequest] = jsonFormat4(PricingCalculateRequest)
  implicit val pricingCalculateResponseFormat: RootJsonFormat[PricingCalculateResponse] = jsonFormat5(PricingCalculateResponse)

  implicit val revenueSummaryFormat: RootJsonFormat[RevenueSummary] = jsonFormat4(RevenueSummary)
  implicit val lotRevenueItemFormat: RootJsonFormat[LotRevenueItem] = jsonFormat4(LotRevenueItem)
  implicit val vehicleTypeRevenueItemFormat: RootJsonFormat[VehicleTypeRevenueItem] = jsonFormat3(VehicleTypeRevenueItem)
  implicit val revenueTrendPointFormat: RootJsonFormat[RevenueTrendPoint] = jsonFormat3(RevenueTrendPoint)
  implicit val analyticsResponseFormat: RootJsonFormat[AnalyticsResponse] = jsonFormat4(AnalyticsResponse)
}

