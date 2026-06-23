package com.metropolisparking.repositories

import com.metropolisparking.config.AppConfig
import com.metropolisparking.models.{ParkingSpot, ParkingTicket}
import com.zaxxer.hikari.{HikariConfig, HikariDataSource}
import java.time.Instant
import java.time.temporal.ChronoUnit
import org.flywaydb.core.Flyway
import org.jooq.SQLDialect
import org.jooq.impl.DSL
import org.scalatest.BeforeAndAfterAll
import org.scalatest.concurrent.ScalaFutures
import org.scalatest.matchers.should.Matchers
import org.scalatest.wordspec.AnyWordSpec
import scala.concurrent.ExecutionContext
import scala.concurrent.duration._

class JooqParkingRepositorySpec
  extends AnyWordSpec
  with Matchers
  with BeforeAndAfterAll
  with ScalaFutures {

  // Setup future timeout for ScalaFutures
  implicit val defaultPatience: PatienceConfig = PatienceConfig(timeout = 5.seconds, interval = 100.milliseconds)

  private var dataSource: HikariDataSource = _
  private var dbExecutor: java.util.concurrent.ExecutorService = _
  private var repository: JooqParkingRepository = _

  override protected def beforeAll(): Unit = {
    super.beforeAll()
    System.setProperty("APP_ENV", "test")
    val config = AppConfig.load()

    // 1. Initialize DataSource
    val hikariConfig = new HikariConfig()
    hikariConfig.setDriverClassName(config.db.driver)
    hikariConfig.setJdbcUrl(config.db.url)
    config.db.user.foreach(hikariConfig.setUsername)
    config.db.password.foreach(hikariConfig.setPassword)
    hikariConfig.setMaximumPoolSize(config.db.numThreads)
    dataSource = new HikariDataSource(hikariConfig)

    // 2. Run Migrations
    val flyway = Flyway.configure()
      .dataSource(dataSource)
      .outOfOrder(true)
      .load()
    flyway.migrate()

    // 3. Initialize Repository
    val dslContext = DSL.using(dataSource, SQLDialect.H2)
    dbExecutor = java.util.concurrent.Executors.newFixedThreadPool(config.db.numThreads)
    val dbExecutionContext = ExecutionContext.fromExecutor(dbExecutor)
    repository = new JooqParkingRepository(dslContext)(dbExecutionContext)
  }

  override protected def afterAll(): Unit = {
    if (dataSource != null) dataSource.close()
    if (dbExecutor != null) dbExecutor.shutdown()
    System.clearProperty("APP_ENV")
    super.afterAll()
  }

  "JooqParkingRepository" should {
    "list the pre-seeded parking spots" in {
      val spots = repository.listSpots().futureValue
      spots should not be empty
      spots.map(_.id) should contain allOf ("spot-1", "spot-2", "spot-3", "spot-4", "spot-5", "spot-6")
      spots.find(_.id == "spot-1").map(_.spotNumber) shouldBe Some("A101")
      spots.find(_.id == "spot-1").map(_.spotType) shouldBe Some("Compact")
    }

    "retrieve a specific parking spot by ID" in {
      val spotOpt = repository.getSpot("spot-3").futureValue
      spotOpt shouldBe defined
      spotOpt.get.spotNumber shouldBe "B101"
      spotOpt.get.spotType shouldBe "Large"
      spotOpt.get.isOccupied shouldBe false
    }

    "update and retrieve a parking spot's occupation state" in {
      val spot = repository.getSpot("spot-1").futureValue.get
      val updatedSpot = spot.copy(isOccupied = true)
      
      val updateResult = repository.updateSpot(updatedSpot).futureValue
      updateResult.isOccupied shouldBe true

      val fetchedSpot = repository.getSpot("spot-1").futureValue.get
      fetchedSpot.isOccupied shouldBe true
    }

    "issue a new parking ticket and retrieve it" in {
      val ticketId = "ticket-test-123"
      val issuedTime = Instant.now().truncatedTo(ChronoUnit.MILLIS)
      val ticket = ParkingTicket(
        id = ticketId,
        spotId = "spot-2",
        licensePlate = "XYZ-9876",
        issuedAt = issuedTime,
        paidAt = None,
        amountPaid = None
      )

      val issued = repository.issueTicket(ticket).futureValue
      issued.id shouldBe ticketId

      val fetchedOpt = repository.getTicket(ticketId).futureValue
      fetchedOpt shouldBe defined
      val fetched = fetchedOpt.get

      fetched.id shouldBe ticketId
      fetched.spotId shouldBe "spot-2"
      fetched.licensePlate shouldBe "XYZ-9876"
      fetched.issuedAt shouldBe issuedTime
      fetched.paidAt shouldBe None
      fetched.amountPaid shouldBe None
    }

    "update a ticket when paid and retrieve it" in {
      val ticketId = "ticket-test-123"
      val originalTicket = repository.getTicket(ticketId).futureValue.get
      val paidTime = Instant.now().truncatedTo(ChronoUnit.MILLIS)
      val amount = BigDecimal("15.50")
      
      val updatedTicket = originalTicket.copy(
        paidAt = Some(paidTime),
        amountPaid = Some(amount)
      )

      val updated = repository.updateTicket(updatedTicket).futureValue
      updated.paidAt shouldBe Some(paidTime)
      updated.amountPaid shouldBe Some(amount)

      val fetched = repository.getTicket(ticketId).futureValue.get
      fetched.paidAt shouldBe Some(paidTime)
      fetched.amountPaid shouldBe Some(amount)
    }
  }
}
