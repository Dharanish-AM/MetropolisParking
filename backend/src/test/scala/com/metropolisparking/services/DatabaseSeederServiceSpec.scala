package com.metropolisparking.services

import com.metropolisparking.TestDbSpec
import org.scalatest.funspec.AnyFunSpec
import org.scalatest.matchers.should.Matchers

class DatabaseSeederServiceSpec extends AnyFunSpec with Matchers with TestDbSpec {
  val seederService = new DatabaseSeederService(dslContext)

  describe("DatabaseSeederService") {
    it("should execute ensureSeeded without errors and guarantee active passes for demo users") {
      seederService.ensureSeeded()

      val activeSessions = dslContext.resultQuery(
        "SELECT COUNT(*) FROM parking_sessions WHERE exit_time IS NULL"
      ).fetchOne(0, classOf[java.lang.Integer])

      activeSessions.intValue() should be >= 1

      val activeReservations = dslContext.resultQuery(
        "SELECT COUNT(*) FROM reservations WHERE status IN ('CONFIRMED', 'PENDING')"
      ).fetchOne(0, classOf[java.lang.Integer])

      activeReservations.intValue() should be >= 1
    }
  }
}
