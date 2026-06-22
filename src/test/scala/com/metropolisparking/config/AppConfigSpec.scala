package com.metropolisparking.config

import org.scalatest.BeforeAndAfterEach
import org.scalatest.matchers.should.Matchers
import org.scalatest.wordspec.AnyWordSpec

class AppConfigSpec extends AnyWordSpec with Matchers with BeforeAndAfterEach {

  override protected def beforeEach(): Unit = {
    System.clearProperty("APP_ENV")
    super.beforeEach()
  }

  override protected def afterEach(): Unit = {
    System.clearProperty("APP_ENV")
    super.afterEach()
  }

  "AppConfig.load" should {
    "default to the local profile when APP_ENV is not set" in {
      val config = AppConfig.load()

      config.app.environment shouldBe "local"
      config.http.port shouldBe 8080
    }

    "load the production profile when APP_ENV is set to production" in {
      System.setProperty("APP_ENV", "production")

      val config = AppConfig.load()

      config.app.environment shouldBe "production"
      config.http.port shouldBe 8080
    }

    "reject unsupported environment values with a clear error" in {
      System.setProperty("APP_ENV", "staging")

      val exception = the[IllegalArgumentException] thrownBy AppConfig.load()

      exception.getMessage should include("Unsupported APP_ENV 'staging'")
    }
  }
}
