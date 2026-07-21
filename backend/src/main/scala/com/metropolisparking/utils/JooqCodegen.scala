package com.metropolisparking.utils

import org.jooq.codegen.GenerationTool
import org.jooq.meta.jaxb._

object JooqCodegen {
  def main(args: Array[String]): Unit = {
    val dbUrl = sys.env.getOrElse("DB_URL", "jdbc:postgresql://localhost:5432/metropolis_parking")
    val dbUser = sys.env.getOrElse("DB_USERNAME", "postgres")
    val dbPassword = sys.env.getOrElse("DB_PASSWORD", "password")

    val configuration = new Configuration()
      .withJdbc(new Jdbc()
        .withDriver("org.postgresql.Driver")
        .withUrl(dbUrl)
        .withUser(dbUser)
        .withPassword(dbPassword))
      .withGenerator(new Generator()
        .withName("org.jooq.codegen.ScalaGenerator")
        .withDatabase(new Database()
          .withName("org.jooq.meta.postgres.PostgresDatabase")
          .withInputSchema("public")
          .withIncludes(".*")
          .withExcludes("flyway_schema_history"))
        .withTarget(new Target()
          .withPackageName("com.metropolisparking.jooq")
          .withDirectory("src/main/scala")))

    GenerationTool.generate(configuration)
  }
}
