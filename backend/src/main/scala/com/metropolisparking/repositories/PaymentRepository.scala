package com.metropolisparking.repositories

import com.metropolisparking.jooq.Tables.PAYMENTS
import com.metropolisparking.models.Payment
import org.jooq.DSLContext
import java.time.OffsetDateTime
import java.util.UUID
import scala.jdk.CollectionConverters._

class PaymentRepository(dsl: DSLContext) extends BaseRepository(dsl) {
  private def ctx(txDsl: Option[DSLContext]): DSLContext = txDsl.getOrElse(dsl)

  def create(payment: Payment, txDsl: Option[DSLContext] = None): Payment = {
    ctx(txDsl).insertInto(PAYMENTS)
      .set(PAYMENTS.ID, payment.id)
      .set(PAYMENTS.SESSION_ID, payment.sessionId)
      .set(PAYMENTS.AMOUNT, payment.amount.bigDecimal)
      .set(PAYMENTS.METHOD, payment.method)
      .set(PAYMENTS.STATUS, payment.status)
      .execute()
    payment
  }

  def findById(id: UUID, txDsl: Option[DSLContext] = None): Option[Payment] = {
    Option(
      ctx(txDsl).selectFrom(PAYMENTS)
        .where(PAYMENTS.ID.eq(id))
        .fetchAny()
    ).map(mapRecord)
  }

  def findBySessionId(sessionId: UUID, txDsl: Option[DSLContext] = None): Option[Payment] = {
    Option(
      ctx(txDsl).selectFrom(PAYMENTS)
        .where(PAYMENTS.SESSION_ID.eq(sessionId))
        .orderBy(PAYMENTS.CREATED_AT.desc())
        .fetchAny()
    ).map(mapRecord)
  }

  def update(payment: Payment, txDsl: Option[DSLContext] = None): Payment = {
    ctx(txDsl).update(PAYMENTS)
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
