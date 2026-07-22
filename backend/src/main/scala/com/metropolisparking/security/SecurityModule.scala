package com.metropolisparking.security

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import org.mindrot.jbcrypt.BCrypt
import java.util.Date
import scala.util.Try

case class UserClaims(userId: String, role: String)

class SecurityModule(jwtSecret: String) {
  private val algorithm = Algorithm.HMAC256(jwtSecret)
  private val verifier = JWT.require(algorithm).build()

  def hashPassword(password: String): String = {
    BCrypt.hashpw(password, BCrypt.gensalt())
  }

  def checkPassword(password: String, hash: String): Boolean = {
    Try(BCrypt.checkpw(password, hash)).getOrElse(false)
  }

  def generateToken(userId: String, role: String, expireDurationSeconds: Long): String = {
    val now = new Date()
    val expiresAt = new Date(now.getTime + expireDurationSeconds * 1000)
    JWT.create()
      .withSubject(userId)
      .withClaim("role", role)
      .withIssuedAt(now)
      .withExpiresAt(expiresAt)
      .sign(algorithm)
  }

  def verifyToken(token: String): Try[UserClaims] = {
    Try {
      val decoded = verifier.verify(token)
      val userId = decoded.getSubject
      val role = decoded.getClaim("role").asString()
      UserClaims(userId, role)
    }
  }
}
