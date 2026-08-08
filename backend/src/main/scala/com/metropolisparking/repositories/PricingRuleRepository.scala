package com.metropolisparking.repositories

import com.metropolisparking.models.PricingRule
import org.jooq.{DSLContext, Record}
import java.util.UUID
import scala.jdk.CollectionConverters._

class PricingRuleRepository(dsl: DSLContext) extends BaseRepository(dsl) {

  private val SqlSelect =
    "SELECT id, rule_type, rate, vehicle_type, lot_id, start_hour, end_hour, occupancy_threshold, surge_multiplier, min_fee, max_daily_cap FROM pricing_rules"

  def create(rule: PricingRule): PricingRule = {
    dsl.query(
      """INSERT INTO pricing_rules (id, rule_type, rate, vehicle_type, lot_id, start_hour, end_hour, occupancy_threshold, surge_multiplier, min_fee, max_daily_cap)
        |VALUES (?::uuid, ?, ?, ?, ?::uuid, ?, ?, ?, ?, ?, ?)""".stripMargin,
      rule.id,
      rule.ruleType,
      rule.rate.bigDecimal,
      rule.vehicleType.orNull,
      rule.lotId.map(_.toString).orNull,
      java.lang.Integer.valueOf(rule.startHour),
      java.lang.Integer.valueOf(rule.endHour),
      java.lang.Integer.valueOf(rule.occupancyThreshold),
      rule.surgeMultiplier.bigDecimal,
      rule.minFee.bigDecimal,
      rule.maxDailyCap.bigDecimal
    ).execute()
    rule
  }

  def update(rule: PricingRule): PricingRule = {
    dsl.query(
      """UPDATE pricing_rules
        |SET rule_type = ?, rate = ?, vehicle_type = ?, lot_id = ?::uuid, start_hour = ?, end_hour = ?, occupancy_threshold = ?, surge_multiplier = ?, min_fee = ?, max_daily_cap = ?, updated_at = CURRENT_TIMESTAMP
        |WHERE id = ?::uuid""".stripMargin,
      rule.ruleType,
      rule.rate.bigDecimal,
      rule.vehicleType.orNull,
      rule.lotId.map(_.toString).orNull,
      java.lang.Integer.valueOf(rule.startHour),
      java.lang.Integer.valueOf(rule.endHour),
      java.lang.Integer.valueOf(rule.occupancyThreshold),
      rule.surgeMultiplier.bigDecimal,
      rule.minFee.bigDecimal,
      rule.maxDailyCap.bigDecimal,
      rule.id
    ).execute()
    rule
  }

  def delete(id: UUID): Boolean = {
    dsl.query("DELETE FROM pricing_rules WHERE id = ?::uuid", id).execute() > 0
  }

  def findById(id: UUID): Option[PricingRule] = {
    Option(dsl.resultQuery(s"$SqlSelect WHERE id = ?::uuid", id).fetchOne()).map(mapRecord)
  }

  def findRule(lotId: UUID, vehicleType: String): Option[PricingRule] = {
    Option(
      dsl.resultQuery(s"$SqlSelect WHERE lot_id = ?::uuid AND vehicle_type = ?", lotId, vehicleType).fetchAny()
    ).orElse {
      Option(
        dsl.resultQuery(s"$SqlSelect WHERE lot_id = ?::uuid AND vehicle_type IS NULL", lotId).fetchAny()
      )
    }.orElse {
      Option(
        dsl.resultQuery(s"$SqlSelect WHERE lot_id IS NULL AND vehicle_type = ?", vehicleType).fetchAny()
      )
    }.orElse {
      Option(
        dsl.resultQuery(s"$SqlSelect WHERE lot_id IS NULL AND vehicle_type IS NULL").fetchAny()
      )
    }.map(mapRecord)
  }

  def list(): List[PricingRule] = {
    dsl.resultQuery(SqlSelect).fetch().asScala.map(mapRecord).toList
  }

  private def mapRecord(r: Record): PricingRule = {
    val id = UUID.fromString(r.get("id").toString)
    val ruleType = r.get("rule_type").toString
    val rate = BigDecimal(r.get("rate").toString)
    val vehicleType = Option(r.get("vehicle_type")).map(_.toString)
    val lotId = Option(r.get("lot_id")).map(v => UUID.fromString(v.toString))
    val startH = Option(r.get("start_hour")).map(_.toString.toInt).getOrElse(0)
    val endH = Option(r.get("end_hour")).map(_.toString.toInt).getOrElse(24)
    val occThresh = Option(r.get("occupancy_threshold")).map(_.toString.toInt).getOrElse(0)
    val surgeMult = Option(r.get("surge_multiplier")).map(v => BigDecimal(v.toString)).getOrElse(BigDecimal("1.00"))
    val minF = Option(r.get("min_fee")).map(v => BigDecimal(v.toString)).getOrElse(BigDecimal("0.00"))
    val maxCap = Option(r.get("max_daily_cap")).map(v => BigDecimal(v.toString)).getOrElse(BigDecimal("100.00"))

    PricingRule(
      id = id,
      ruleType = ruleType,
      rate = rate,
      vehicleType = vehicleType,
      lotId = lotId,
      startHour = startH,
      endHour = endH,
      occupancyThreshold = occThresh,
      surgeMultiplier = surgeMult,
      minFee = minF,
      maxDailyCap = maxCap
    )
  }
}
