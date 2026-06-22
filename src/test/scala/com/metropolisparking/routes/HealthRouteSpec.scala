package com.metropolisparking.routes

import org.apache.pekko.http.scaladsl.model.StatusCodes
import org.apache.pekko.http.scaladsl.testkit.ScalatestRouteTest
import org.scalatest.matchers.should.Matchers
import org.scalatest.wordspec.AnyWordSpec
import spray.json._

class HealthRouteSpec extends AnyWordSpec with Matchers with ScalatestRouteTest {
  val healthRoute = new HealthRoute().route

  "The HealthRoute" should {
    "return HTTP 200 OK and status UP for GET /health" in {
      Get("/health") ~> healthRoute ~> check {
        status shouldEqual StatusCodes.OK
        
        // Verify JSON response body
        val responseJson = entityAs[String].parseJson.asJsObject
        responseJson.fields should contain key "status"
        responseJson.fields("status") shouldEqual JsString("UP")
      }
    }
  }
}
