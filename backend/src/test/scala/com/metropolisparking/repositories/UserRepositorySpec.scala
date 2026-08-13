package com.metropolisparking.repositories

import com.metropolisparking.{TestDbSpec, TestFixtures}
import com.metropolisparking.models.User
import org.scalatest.funspec.AnyFunSpec
import org.scalatest.matchers.should.Matchers
import java.util.UUID

class UserRepositorySpec extends AnyFunSpec with Matchers with TestDbSpec {

  val repo = new UserRepository(dslContext)

  describe("UserRepository") {
    it("creates and retrieves users with associated role name by email and id") {
      val customerRoleId = repo.getRoleIdByName("CUSTOMER").get
      val email = s"repo-user-${UUID.randomUUID()}@example.com"
      val user = User(
        id = UUID.randomUUID(),
        name = "Repo Test User",
        email = email,
        passwordHash = "$2a$10$wE9923K/g16yLdFvP7W53.Oq8uF7QG4vYq9x1nN7f1N/1N1N1N1N1",
        roleId = customerRoleId
      )

      repo.create(user)

      val byEmail = repo.findByEmail(email)
      byEmail shouldBe defined
      byEmail.get._1.name shouldBe "Repo Test User"
      byEmail.get._2 shouldBe "CUSTOMER"

      val byId = repo.findById(user.id)
      byId shouldBe defined
      byId.get._1.email shouldBe email
      byId.get._2 shouldBe "CUSTOMER"
    }

    it("returns role ID for valid role names") {
      repo.getRoleIdByName("ADMIN") shouldBe defined
      repo.getRoleIdByName("CUSTOMER") shouldBe defined
      repo.getRoleIdByName("INVALID_ROLE") shouldBe None
    }
  }
}
