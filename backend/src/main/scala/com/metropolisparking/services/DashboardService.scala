package com.metropolisparking.services

import com.metropolisparking.dto.{DashboardStats, OccupancyStats, FinancialStats, SessionDetail}
import com.metropolisparking.dto.DtoFormats._
import com.metropolisparking.jooq.Tables.{PARKING_SPACES, PAYMENTS, PARKING_SESSIONS, VEHICLES}
import org.jooq.DSLContext
import spray.json._
import scala.jdk.CollectionConverters._
import scala.util.Try

class DashboardService(dsl: DSLContext, redisService: Option[RedisService] = None) {
  private val CacheKey = "dashboard:stats"
  private val CacheTtlSeconds = 30

  def getStats(): DashboardStats = {
    redisService.flatMap(_.get(CacheKey)).flatMap { cachedJson =>
      Try(cachedJson.parseJson.convertTo[DashboardStats]).toOption
    }.getOrElse {
      val stats = computeStats()
      redisService.foreach(_.setEx(CacheKey, CacheTtlSeconds, stats.toJson.compactPrint))
      stats
    }
  }

  private def computeStats(): DashboardStats = {
    val totalSpaces = dsl.fetchCount(PARKING_SPACES, PARKING_SPACES.DELETED_AT.isNull)
    val occupiedSpaces = dsl.fetchCount(
      PARKING_SPACES,
      PARKING_SPACES.STATUS.eq("OCCUPIED").and(PARKING_SPACES.DELETED_AT.isNull)
    )
    val availableSpaces = dsl.fetchCount(
      PARKING_SPACES,
      PARKING_SPACES.STATUS.eq("AVAILABLE").and(PARKING_SPACES.DELETED_AT.isNull)
    )
    val rate = if (totalSpaces > 0) (occupiedSpaces.toDouble / totalSpaces.toDouble) * 100.0 else 0.0
    val occupancy = OccupancyStats(totalSpaces, occupiedSpaces, availableSpaces, rate)

    val payments = dsl.select(PAYMENTS.AMOUNT, PAYMENTS.METHOD)
      .from(PAYMENTS)
      .where(PAYMENTS.STATUS.eq("SUCCESS"))
      .fetch().asScala

    val totalRev = payments.map(r => BigDecimal(r.get(PAYMENTS.AMOUNT))).sum
    val revByMethod = payments.groupBy(r => r.get(PAYMENTS.METHOD)).map { case (method, list) =>
      method -> list.map(r => BigDecimal(r.get(PAYMENTS.AMOUNT))).sum
    }
    val financial = FinancialStats(totalRev, revByMethod)

    val recent = dsl.select(
        PARKING_SESSIONS.ID,
        VEHICLES.PLATE_NUMBER,
        PARKING_SPACES.SPACE_NUMBER,
        PARKING_SESSIONS.ENTRY_TIME
      )
      .from(PARKING_SESSIONS)
      .join(VEHICLES).on(PARKING_SESSIONS.VEHICLE_ID.eq(VEHICLES.ID))
      .join(PARKING_SPACES).on(PARKING_SESSIONS.SPACE_ID.eq(PARKING_SPACES.ID))
      .where(PARKING_SESSIONS.EXIT_TIME.isNull)
      .orderBy(PARKING_SESSIONS.ENTRY_TIME.desc())
      .limit(10)
      .fetch().asScala.map { r =>
        SessionDetail(
          id = r.get(PARKING_SESSIONS.ID),
          plateNumber = r.get(VEHICLES.PLATE_NUMBER),
          spaceNumber = r.get(PARKING_SPACES.SPACE_NUMBER),
          entryTime = r.get(PARKING_SESSIONS.ENTRY_TIME).toString,
          status = "ACTIVE"
        )
      }.toList

    DashboardStats(occupancy, financial, recent)
  }

  def invalidateCache(): Unit = {
    redisService.foreach(_.del(CacheKey))
  }
}
