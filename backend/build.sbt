name := "metropolis-parking-backend"

version := "1.0.0"

scalaVersion := "2.13.12"

val AkkaVersion = "2.6.20"
val AkkaHttpVersion = "10.2.10"
val OTelVersion = "1.35.0"
val OTelAlphaVersion = "1.35.0-alpha"

libraryDependencies ++= Seq(
  "com.typesafe.akka" %% "akka-actor-typed" % AkkaVersion,
  "com.typesafe.akka" %% "akka-stream" % AkkaVersion,
  "com.typesafe.akka" %% "akka-http" % AkkaHttpVersion,
  "com.typesafe.akka" %% "akka-http-spray-json" % AkkaHttpVersion,
  "org.jooq" % "jooq" % "3.18.7",
  "org.jooq" % "jooq-meta" % "3.18.7",
  "org.jooq" % "jooq-codegen" % "3.18.7",
  "org.mindrot" % "jbcrypt" % "0.4",
  "com.auth0" % "java-jwt" % "4.4.0",
  "org.flywaydb" % "flyway-core" % "9.22.3",
  "com.zaxxer" % "HikariCP" % "5.1.0",
  "com.github.pureconfig" %% "pureconfig" % "0.17.6",
  "org.postgresql" % "postgresql" % "42.7.2",
  "ch.qos.logback" % "logback-classic" % "1.4.14",
  "org.slf4j" % "slf4j-api" % "2.0.9",
  "redis.clients" % "jedis" % "5.1.0",
  "io.opentelemetry" % "opentelemetry-api" % OTelVersion,
  "io.opentelemetry" % "opentelemetry-sdk" % OTelVersion,
  "io.opentelemetry" % "opentelemetry-exporter-otlp" % OTelVersion,
  "io.opentelemetry" % "opentelemetry-exporter-prometheus" % OTelAlphaVersion,
  "io.opentelemetry.instrumentation" % "opentelemetry-runtime-telemetry-java17" % "2.1.0-alpha",
  "org.scalatest" %% "scalatest" % "3.2.18" % Test,
  "com.typesafe.akka" %% "akka-http-testkit" % AkkaHttpVersion % Test,
  "com.typesafe.akka" %% "akka-actor-testkit-typed" % AkkaVersion % Test
)

Compile / mainClass := Some("com.metropolisparking.Main")
Test / parallelExecution := false

import sbtassembly.MergeStrategy

assembly / assemblyMergeStrategy := {
  case PathList("reference.conf") => MergeStrategy.concat
  case PathList("META-INF", "services", xs @ _*) => MergeStrategy.concat
  case PathList("META-INF", xs @ _*) => MergeStrategy.discard
  case x if x.endsWith("module-info.class") => MergeStrategy.discard
  case x => MergeStrategy.defaultMergeStrategy(x)
}

