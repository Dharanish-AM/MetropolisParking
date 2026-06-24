package com.metropolisparking.routes

import akka.http.scaladsl.model.StatusCodes
import akka.http.scaladsl.testkit.ScalatestRouteTest
import org.scalatest.matchers.should.Matchers
import org.scalatest.wordspec.AnyWordSpec
import spray.json._

import scala.concurrent.Future

class HealthRouteSpec extends AnyWordSpec with Matchers with ScalatestRouteTest {

  "The HealthRoute" should {
    "return HTTP 200 OK and status UP for GET /health when database is healthy" in {
      val healthRoute = new HealthRoute(() => Future.successful(true)).route
      Get("/health") ~> healthRoute ~> check {
        status shouldEqual StatusCodes.OK
        
        // Verify JSON response body
        val responseJson = entityAs[String].parseJson.asJsObject
        responseJson.fields should contain key "status"
        responseJson.fields("status") shouldEqual JsString("UP")
      }
    }

    "return HTTP 503 Service Unavailable and status DOWN for GET /health when database is unhealthy" in {
      val healthRoute = new HealthRoute(() => Future.successful(false)).route
      Get("/health") ~> healthRoute ~> check {
        status shouldEqual StatusCodes.ServiceUnavailable
        
        // Verify JSON response body
        val responseJson = entityAs[String].parseJson.asJsObject
        responseJson.fields should contain key "status"
        responseJson.fields("status") shouldEqual JsString("DOWN")
      }
    }

    "return HTTP 503 Service Unavailable and status DOWN for GET /health when database check fails" in {
      val healthRoute = new HealthRoute(() => Future.failed(new RuntimeException("DB connection error"))).route
      Get("/health") ~> healthRoute ~> check {
        status shouldEqual StatusCodes.ServiceUnavailable
        
        // Verify JSON response body
        val responseJson = entityAs[String].parseJson.asJsObject
        responseJson.fields should contain key "status"
        responseJson.fields("status") shouldEqual JsString("DOWN")
      }
    }
  }
}
