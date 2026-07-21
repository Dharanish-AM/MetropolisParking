package com.metropolisparking.repositories

import com.metropolisparking.jooq.Tables.{USERS, ROLES}
import com.metropolisparking.models.User
import org.jooq.DSLContext
import java.util.UUID

class UserRepository(dsl: DSLContext) extends BaseRepository(dsl) {
  def findByEmail(email: String): Option[(User, String)] = {
    Option(
      dsl.select(USERS.asterisk(), ROLES.NAME)
        .from(USERS)
        .join(ROLES).on(USERS.ROLE_ID.eq(ROLES.ID))
        .where(USERS.EMAIL.eq(email).and(USERS.DELETED_AT.isNull))
        .fetchOne()
    ).map { record =>
      val uRec = record.into(USERS)
      val user = User(
        id = uRec.getId,
        name = uRec.getName,
        email = uRec.getEmail,
        passwordHash = uRec.getPasswordHash,
        roleId = uRec.getRoleId
      )
      val roleName = record.get(ROLES.NAME)
      (user, roleName)
    }
  }

  def findById(id: UUID): Option[(User, String)] = {
    Option(
      dsl.select(USERS.asterisk(), ROLES.NAME)
        .from(USERS)
        .join(ROLES).on(USERS.ROLE_ID.eq(ROLES.ID))
        .where(USERS.ID.eq(id).and(USERS.DELETED_AT.isNull))
        .fetchOne()
    ).map { record =>
      val uRec = record.into(USERS)
      val user = User(
        id = uRec.getId,
        name = uRec.getName,
        email = uRec.getEmail,
        passwordHash = uRec.getPasswordHash,
        roleId = uRec.getRoleId
      )
      val roleName = record.get(ROLES.NAME)
      (user, roleName)
    }
  }

  def create(user: User): User = {
    dsl.insertInto(USERS)
      .set(USERS.ID, user.id)
      .set(USERS.NAME, user.name)
      .set(USERS.EMAIL, user.email)
      .set(USERS.PASSWORD_HASH, user.passwordHash)
      .set(USERS.ROLE_ID, user.roleId)
      .execute()
    user
  }

  def getRoleIdByName(roleName: String): Option[UUID] = {
    Option(
      dsl.selectFrom(ROLES)
        .where(ROLES.NAME.eq(roleName))
        .fetchOne()
    ).map(_.getId)
  }
}
