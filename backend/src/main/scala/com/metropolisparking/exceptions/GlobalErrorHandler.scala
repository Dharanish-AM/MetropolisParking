package com.metropolisparking.exceptions

import akka.http.scaladsl.model.StatusCodes._
import akka.http.scaladsl.model._
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server._
import spray.json.DefaultJsonProtocol._
import spray.json._
import java.time.format.DateTimeFormatter
import java.time.Instant

case class ErrorResponse(code: String, message: String, timestamp: String)

object GlobalErrorHandler {
  implicit val errorResponseFormat: RootJsonFormat[ErrorResponse] = jsonFormat3(ErrorResponse)

  private def jsonResponse(status: StatusCode, code: String, message: String): HttpResponse = {
    val error = ErrorResponse(code, message, DateTimeFormatter.ISO_INSTANT.format(Instant.now()))
    HttpResponse(
      status = status,
      entity = HttpEntity(ContentTypes.`application/json`, error.toJson.compactPrint)
    )
  }

  def exceptionHandler: ExceptionHandler = ExceptionHandler {
    case ex: ValidationException =>
      complete(jsonResponse(BadRequest, ex.code, ex.message))
    case ex: AuthenticationException =>
      complete(jsonResponse(Unauthorized, ex.code, ex.message))
    case ex: AuthorizationException =>
      complete(jsonResponse(Forbidden, ex.code, ex.message))
    case ex: NotFoundException =>
      complete(jsonResponse(NotFound, ex.code, ex.message))
    case ex: ConflictException =>
      complete(jsonResponse(Conflict, ex.code, ex.message))
    case ex: BusinessRuleException =>
      complete(jsonResponse(UnprocessableEntity, ex.code, ex.message))
    case ex: MetropolisException =>
      complete(jsonResponse(InternalServerError, ex.code, ex.message))
    case ex: Throwable =>
      complete(jsonResponse(InternalServerError, "INTERNAL_SERVER_ERROR", Option(ex.getMessage).getOrElse("An unexpected error occurred")))
  }

  def rejectionHandler: RejectionHandler = RejectionHandler.newBuilder()
    .handle {
      case MalformedRequestContentRejection(msg, _) =>
        complete(jsonResponse(BadRequest, "MALFORMED_REQUEST", msg))
      case ValidationRejection(msg, _) =>
        complete(jsonResponse(BadRequest, "VALIDATION_ERROR", msg))
      case MissingQueryParamRejection(param) =>
        complete(jsonResponse(BadRequest, "MISSING_QUERY_PARAM", s"Query parameter '$param' is required"))
      case MissingHeaderRejection(header) =>
        complete(jsonResponse(BadRequest, "MISSING_HEADER", s"HTTP header '$header' is required"))
    }
    .handleNotFound {
      complete(jsonResponse(NotFound, "RESOURCE_NOT_FOUND", "The requested resource was not found"))
    }
    .result()
}
