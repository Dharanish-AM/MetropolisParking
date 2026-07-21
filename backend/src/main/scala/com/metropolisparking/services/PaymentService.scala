package com.metropolisparking.services

import com.metropolisparking.dto.PaymentProcessRequest
import com.metropolisparking.exceptions.{ConflictException, NotFoundException}
import com.metropolisparking.models.Payment
import com.metropolisparking.repositories.PaymentRepository
import com.metropolisparking.validation.Validator
import java.util.UUID

class PaymentService(
  repo: PaymentRepository,
  auditLogService: AuditLogService
) {
  def processPayment(paymentId: UUID, req: PaymentProcessRequest, userId: Option[UUID]): Payment = {
    val payment = repo.findById(paymentId).getOrElse {
      throw NotFoundException(s"Payment record '$paymentId' not found")
    }

    Validator.validateEnum(req.method.toUpperCase, Set("CASH", "CARD", "UPI", "WALLET"), "method")

    if (!payment.status.equalsIgnoreCase("PENDING")) {
      throw ConflictException(s"Payment is already in status '${payment.status}'")
    }

    val updated = payment.copy(
      method = req.method.toUpperCase,
      status = "SUCCESS"
    )
    repo.update(updated)

    auditLogService.logAction(
      userId,
      "PAYMENT_COMPLETED",
      "payments",
      Some(paymentId),
      Some(s"Processed payment of ${payment.amount} using ${req.method.toUpperCase}")
    )
    updated
  }

  def list(): List[Payment] = repo.list()
}
