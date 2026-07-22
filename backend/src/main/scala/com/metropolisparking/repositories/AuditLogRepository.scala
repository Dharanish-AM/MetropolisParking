package com.metropolisparking.repositories

import com.metropolisparking.jooq.Tables.AUDIT_LOGS
import com.metropolisparking.models.AuditLog
import org.jooq.DSLContext
import java.time.{OffsetDateTime, ZoneOffset}
import scala.jdk.CollectionConverters._

class AuditLogRepository(dsl: DSLContext) extends BaseRepository(dsl) {
  def create(log: AuditLog): AuditLog = {
    dsl.insertInto(AUDIT_LOGS)
      .set(AUDIT_LOGS.ID, log.id)
      .set(AUDIT_LOGS.USER_ID, log.userId.orNull)
      .set(AUDIT_LOGS.ACTION, log.action)
      .set(AUDIT_LOGS.ENTITY_TYPE, log.entityType)
      .set(AUDIT_LOGS.ENTITY_ID, log.entityId.orNull)
      .set(AUDIT_LOGS.DETAILS, log.details.orNull)
      .set(AUDIT_LOGS.TIMESTAMP, OffsetDateTime.ofInstant(log.timestamp, ZoneOffset.UTC))
      .execute()
    log
  }

  def list(): List[AuditLog] = {
    dsl.selectFrom(AUDIT_LOGS)
      .orderBy(AUDIT_LOGS.TIMESTAMP.desc())
      .fetch().asScala.map { r =>
        AuditLog(
          id = r.getId,
          userId = Option(r.getUserId),
          action = r.getAction,
          entityType = r.getEntityType,
          entityId = Option(r.getEntityId),
          details = Option(r.getDetails),
          timestamp = r.getTimestamp.toInstant
        )
      }.toList
  }
}
