package com.metropolisparking.repositories

import com.metropolisparking.jooq.Tables.PRICING_RULES
import com.metropolisparking.models.PricingRule
import org.jooq.DSLContext
import java.util.UUID
import scala.jdk.CollectionConverters._

class PricingRuleRepository(dsl: DSLContext) extends BaseRepository(dsl) {
  def create(rule: PricingRule): PricingRule = {
    dsl.insertInto(PRICING_RULES)
      .set(PRICING_RULES.ID, rule.id)
      .set(PRICING_RULES.RULE_TYPE, rule.ruleType)
      .set(PRICING_RULES.RATE, rule.rate.bigDecimal)
      .set(PRICING_RULES.VEHICLE_TYPE, rule.vehicleType.orNull)
      .set(PRICING_RULES.LOT_ID, rule.lotId.orNull)
      .execute()
    rule
  }

  def findRule(lotId: UUID, vehicleType: String): Option[PricingRule] = {
    Option(
      dsl.selectFrom(PRICING_RULES)
        .where(
          PRICING_RULES.LOT_ID.eq(lotId)
            .and(PRICING_RULES.VEHICLE_TYPE.eq(vehicleType))
        )
        .fetchAny()
    ).orElse {
      Option(
        dsl.selectFrom(PRICING_RULES)
          .where(PRICING_RULES.LOT_ID.eq(lotId).and(PRICING_RULES.VEHICLE_TYPE.isNull))
          .fetchAny()
      )
    }.orElse {
      Option(
        dsl.selectFrom(PRICING_RULES)
          .where(PRICING_RULES.LOT_ID.isNull.and(PRICING_RULES.VEHICLE_TYPE.eq(vehicleType)))
          .fetchAny()
      )
    }.orElse {
      Option(
        dsl.selectFrom(PRICING_RULES)
          .where(PRICING_RULES.LOT_ID.isNull.and(PRICING_RULES.VEHICLE_TYPE.isNull))
          .fetchAny()
      )
    }.map(mapRecord)
  }

  def list(): List[PricingRule] = {
    dsl.selectFrom(PRICING_RULES)
      .fetch().asScala.map(mapRecord).toList
  }

  private def mapRecord(r: com.metropolisparking.jooq.tables.records.PricingRulesRecord): PricingRule = {
    PricingRule(
      id = r.getId,
      ruleType = r.getRuleType,
      rate = BigDecimal(r.getRate),
      vehicleType = Option(r.getVehicleType),
      lotId = Option(r.getLotId)
    )
  }
}
