package com.metropolisparking.services

import com.metropolisparking.dto._
import com.metropolisparking.jooq.Tables.{PARKING_LOTS, PARKING_SESSIONS, PARKING_SPACES, PAYMENTS, VEHICLES}
import org.jooq.DSLContext
import java.time.format.DateTimeFormatter
import java.time.{Instant, LocalDate, ZoneId}
import java.util.UUID
import scala.jdk.CollectionConverters._

class RevenueAnalyticsService(dsl: DSLContext) {

  def getAnalytics(lotIdOpt: Option[UUID]): AnalyticsResponse = {
    val completedSessions = dsl.select(
        PARKING_SESSIONS.ID,
        PARKING_SESSIONS.ENTRY_TIME,
        PARKING_SESSIONS.EXIT_TIME,
        PARKING_SESSIONS.FEE,
        PARKING_SPACES.LOT_ID,
        PARKING_LOTS.NAME,
        VEHICLES.TYPE
      )
      .from(PARKING_SESSIONS)
      .innerJoin(PARKING_SPACES).on(PARKING_SESSIONS.SPACE_ID.eq(PARKING_SPACES.ID))
      .innerJoin(PARKING_LOTS).on(PARKING_SPACES.LOT_ID.eq(PARKING_LOTS.ID))
      .innerJoin(VEHICLES).on(PARKING_SESSIONS.VEHICLE_ID.eq(VEHICLES.ID))
      .where(PARKING_SESSIONS.FEE.isNotNull)
      .fetch().asScala.toList

    val filteredSessions = lotIdOpt match {
      case Some(lotId) => completedSessions.filter(r => r.get(PARKING_SPACES.LOT_ID) == lotId)
      case None        => completedSessions
    }

    val totalRevenue = filteredSessions.map(r => BigDecimal(r.get(PARKING_SESSIONS.FEE))).sum
    val totalSessions = filteredSessions.size.toLong
    val avgFee = if (totalSessions > 0) (totalRevenue / BigDecimal(totalSessions)).setScale(2, scala.math.BigDecimal.RoundingMode.HALF_UP) else BigDecimal("0.00")

    val todayDateStr = LocalDate.now(ZoneId.systemDefault()).toString
    val todayRevenue = filteredSessions.filter { r =>
      val entryInstant = Option(r.get(PARKING_SESSIONS.ENTRY_TIME)).map(_.toInstant).getOrElse(Instant.now())
      val entryDate = LocalDate.ofInstant(entryInstant, ZoneId.systemDefault()).toString
      entryDate == todayDateStr
    }.map(r => BigDecimal(r.get(PARKING_SESSIONS.FEE))).sum

    val summary = RevenueSummary(
      totalRevenue = totalRevenue,
      todayRevenue = todayRevenue,
      totalSessions = totalSessions,
      avgSessionFee = avgFee
    )

    val lotBreakdown = filteredSessions.groupBy(r => (r.get(PARKING_SPACES.LOT_ID), r.get(PARKING_LOTS.NAME)))
      .map { case ((lotId, lotName), list) =>
        val rev = list.map(r => BigDecimal(r.get(PARKING_SESSIONS.FEE))).sum
        LotRevenueItem(lotId, lotName, rev, list.size.toLong)
      }.toList.sortBy(_.totalRevenue)(Ordering[BigDecimal].reverse)

    val vehicleBreakdownRaw = filteredSessions.groupBy(r => Option(r.get(VEHICLES.TYPE)).getOrElse("CAR"))
      .map { case (vType, list) =>
        val rev = list.map(r => BigDecimal(r.get(PARKING_SESSIONS.FEE))).sum
        val pct = if (totalRevenue > 0) ((rev / totalRevenue) * 100.0).toDouble else 0.0
        VehicleTypeRevenueItem(vType, rev, Math.round(pct * 100.0) / 100.0)
      }.toList.sortBy(_.totalRevenue)(Ordering[BigDecimal].reverse)

    val formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")
    val trendPoints = filteredSessions.groupBy { r =>
      val inst = Option(r.get(PARKING_SESSIONS.ENTRY_TIME)).map(_.toInstant).getOrElse(Instant.now())
      LocalDate.ofInstant(inst, ZoneId.systemDefault()).format(formatter)
    }.map { case (dateStr, list) =>
      val rev = list.map(r => BigDecimal(r.get(PARKING_SESSIONS.FEE))).sum
      RevenueTrendPoint(dateStr, rev, list.size.toLong)
    }.toList.sortBy(_.date)

    AnalyticsResponse(summary, lotBreakdown, vehicleBreakdownRaw, trendPoints)
  }
}
