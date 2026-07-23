package com.metropolisparking.models

import java.time.Instant
import java.util.UUID

case class Reservation(
  id: UUID,
  userId: UUID,
  spaceId: UUID,
  startTime: Instant,
  endTime: Instant,
  status: String,
  fee: BigDecimal,
  createdAt: Instant,
  updatedAt: Instant
)
