package com.metropolisparking.repositories

import com.metropolisparking.jooq.Tables.PAYMENTS
import com.metropolisparking.models.Payment
import org.jooq.DSLContext
import java.time.OffsetDateTime
import java.util.UUID
import scala.jdk.CollectionConverters._

class PaymentRepository(dsl: DSLContext) extends BaseRepository(dsl) {
  def create(payment: Payment): Payment = {
    dsl.insertInto(PAYMENTS)
      .set(PAYMENTS.ID, payment.id)
      .set(PAYMENTS.SESSION_ID, payment.sessionId)
      .set(PAYMENTS.AMOUNT, payment.amount.bigDecimal)
      .set(PAYMENTS.METHOD, payment.method)
      .set(PAYMENTS.STATUS, payment.status)
      .execute()
    payment
  }

  def findById(id: UUID): Option[Payment] = {
    Option(
      dsl.selectFrom(PAYMENTS)
        .where(PAYMENTS.ID.eq(id))
        .fetchOne()
    ).map(mapRecord)
  }

  def findBySessionId(sessionId: UUID): Option[Payment] = {
    Option(
      dsl.selectFrom(PAYMENTS)
        .where(PAYMENTS.SESSION_ID.eq(sessionId))
        .fetchOne()
    ).map(mapRecord)
  }

  def update(payment: Payment): Payment = {
    dsl.update(PAYMENTS)
      .set(PAYMENTS.STATUS, payment.status)
      .set(PAYMENTS.METHOD, payment.method)
      .set(PAYMENTS.UPDATED_AT, OffsetDateTime.now())
      .where(PAYMENTS.ID.eq(payment.id))
      .execute()
    payment
  }

  def list(): List[Payment] = {
    dsl.selectFrom(PAYMENTS)
      .orderBy(PAYMENTS.CREATED_AT.desc())
      .fetch().asScala.map(mapRecord).toList
  }

  private def mapRecord(r: com.metropolisparking.jooq.tables.records.PaymentsRecord): Payment = {
    Payment(
      id = r.getId,
      sessionId = r.getSessionId,
      amount = BigDecimal(r.getAmount),
      method = r.getMethod,
      status = r.getStatus
    )
  }
}
