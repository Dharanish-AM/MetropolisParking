package com.metropolisparking.services

import com.metropolisparking.dto.{PricingCalculateResponse, PricingRuleCreateRequest}
import com.metropolisparking.exceptions.{ValidationException, NotFoundException}
import com.metropolisparking.models.PricingRule
import com.metropolisparking.repositories.PricingRuleRepository
import org.slf4j.LoggerFactory
import java.time.{Instant, ZoneId, ZonedDateTime}
import java.util.UUID

class PricingRuleService(
  pricingRuleRepo: PricingRuleRepository,
  auditLogService: AuditLogService
) {
  private val logger = LoggerFactory.getLogger(classOf[PricingRuleService])

  def list(): List[PricingRule] = {
    pricingRuleRepo.list()
  }

  def getById(id: UUID): Option[PricingRule] = {
    pricingRuleRepo.findById(id)
  }

  def create(req: PricingRuleCreateRequest, userId: Option[UUID]): PricingRule = {
    if (req.rate <= 0) {
      throw ValidationException("Pricing rate must be greater than 0")
    }

    val rule = PricingRule(
      id = UUID.randomUUID(),
      ruleType = req.ruleType.toUpperCase,
      rate = req.rate,
      vehicleType = req.vehicleType,
      lotId = req.lotId,
      startHour = req.startHour.getOrElse(0),
      endHour = req.endHour.getOrElse(24),
      occupancyThreshold = req.occupancyThreshold.getOrElse(0),
      surgeMultiplier = req.surgeMultiplier.getOrElse(BigDecimal("1.00")),
      minFee = req.minFee.getOrElse(BigDecimal("0.00")),
      maxDailyCap = req.maxDailyCap.getOrElse(BigDecimal("100.00"))
    )

    val created = pricingRuleRepo.create(rule)
    auditLogService.logAction(
      userId,
      "PRICING_RULE_CREATED",
      "pricing_rules",
      Some(created.id),
      Some(s"Created ${created.ruleType} rule of ${created.rate} for lot ${created.lotId.getOrElse("GLOBAL")}")
    )
    created
  }

  def update(id: UUID, req: PricingRuleCreateRequest, userId: Option[UUID]): PricingRule = {
    val existing = pricingRuleRepo.findById(id).getOrElse {
      throw NotFoundException(s"Pricing rule '$id' not found")
    }

    if (req.rate <= 0) {
      throw ValidationException("Pricing rate must be greater than 0")
    }

    val updatedRule = existing.copy(
      ruleType = req.ruleType.toUpperCase,
      rate = req.rate,
      vehicleType = req.vehicleType,
      lotId = req.lotId,
      startHour = req.startHour.getOrElse(0),
      endHour = req.endHour.getOrElse(24),
      occupancyThreshold = req.occupancyThreshold.getOrElse(0),
      surgeMultiplier = req.surgeMultiplier.getOrElse(BigDecimal("1.00")),
      minFee = req.minFee.getOrElse(BigDecimal("0.00")),
      maxDailyCap = req.maxDailyCap.getOrElse(BigDecimal("100.00"))
    )

    pricingRuleRepo.update(updatedRule)
    auditLogService.logAction(
      userId,
      "PRICING_RULE_UPDATED",
      "pricing_rules",
      Some(id),
      Some(s"Updated pricing rule '$id' to ${updatedRule.rate}")
    )
    updatedRule
  }

  def delete(id: UUID, userId: Option[UUID]): Boolean = {
    val existing = pricingRuleRepo.findById(id).getOrElse {
      throw NotFoundException(s"Pricing rule '$id' not found")
    }

    val deleted = pricingRuleRepo.delete(id)
    if (deleted) {
      auditLogService.logAction(
        userId,
        "PRICING_RULE_DELETED",
        "pricing_rules",
        Some(id),
        Some(s"Deleted pricing rule '$id'")
      )
    }
    deleted
  }

  def calculateFee(
    entryTime: Instant,
    exitTime: Instant,
    lotId: UUID,
    vehicleType: String,
    occupancyPct: Double = 0.0
  ): PricingCalculateResponse = {
    val durationMinutes = java.time.Duration.between(entryTime, exitTime).toMinutes.max(1L)
    val ruleOpt = pricingRuleRepo.findRule(lotId, vehicleType)

    val rule = ruleOpt.getOrElse {
      PricingRule(
        id = UUID.randomUUID(),
        ruleType = "HOURLY",
        rate = BigDecimal("5.00"),
        vehicleType = Some(vehicleType),
        lotId = Some(lotId)
      )
    }

    val hours = Math.ceil(durationMinutes.toDouble / 60.0).toLong
    val baseFee: BigDecimal = rule.ruleType.toUpperCase match {
      case "DAILY" =>
        val days = Math.ceil(hours.toDouble / 24.0).toLong.max(1L)
        rule.rate * days
      case "OVERNIGHT" =>
        rule.rate
      case _ =>
        rule.rate * hours
    }

    val entryZdt = ZonedDateTime.ofInstant(entryTime, ZoneId.systemDefault())
    val entryHour = entryZdt.getHour

    val isPeakHour = entryHour >= rule.startHour && entryHour < rule.endHour
    val isHighOccupancy = rule.occupancyThreshold > 0 && occupancyPct >= rule.occupancyThreshold.toDouble

    val surgeMultiplier = if (isPeakHour || isHighOccupancy) {
      rule.surgeMultiplier.max(BigDecimal("1.00"))
    } else {
      BigDecimal("1.00")
    }

    val calculatedFee = (baseFee * surgeMultiplier).setScale(2, scala.math.BigDecimal.RoundingMode.HALF_UP)
    val cappedFee = calculatedFee.min(rule.maxDailyCap).max(rule.minFee)

    PricingCalculateResponse(
      durationMinutes = durationMinutes,
      baseFee = baseFee,
      surgeMultiplier = surgeMultiplier,
      finalFee = cappedFee,
      appliedRuleType = rule.ruleType
    )
  }
}
