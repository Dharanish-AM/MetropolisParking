package com.metropolisparking.services

import com.metropolisparking.models.AuditLog
import com.metropolisparking.repositories.AuditLogRepository
import java.time.Instant
import java.util.UUID

class AuditLogService(repo: AuditLogRepository) {
  def logAction(userId: Option[UUID], action: String, entityType: String, entityId: Option[UUID], details: Option[String]): Unit = {
    val log = AuditLog(
      id = UUID.randomUUID(),
      userId = userId,
      action = action,
      entityType = entityType,
      entityId = entityId,
      details = details,
      timestamp = Instant.now()
    )
    repo.create(log)
  }

  def list(): List[AuditLog] = repo.list()
}
