name := "metropolis-parking"

version := "0.1.0-SNAPSHOT"

scalaVersion := "2.13.18"

val AkkaVersion = "2.6.20"
val AkkaHttpVersion = "10.2.10"
val PureConfigVersion = "0.17.8"
val LogbackVersion = "1.5.16"
val ScalaTestVersion = "3.2.19"

libraryDependencies ++= Seq(
  // Minimal Akka setup for HTTP routing
  "com.typesafe.akka" %% "akka-actor"           % AkkaVersion,
  "com.typesafe.akka" %% "akka-http"            % AkkaHttpVersion,
  "com.typesafe.akka" %% "akka-http-spray-json" % AkkaHttpVersion,
  "com.typesafe.akka" %% "akka-stream"          % AkkaVersion,

  // Configuration management
  "com.github.pureconfig" %% "pureconfig"       % PureConfigVersion,

  // Logging
  "ch.qos.logback" % "logback-classic"          % LogbackVersion,

  // Testing
  "com.typesafe.akka" %% "akka-testkit"         % AkkaVersion % Test,
  "com.typesafe.akka" %% "akka-http-testkit"    % AkkaHttpVersion % Test,
  "org.scalatest"    %% "scalatest"                 % ScalaTestVersion % Test,

  // Database Setup
  "org.jooq"            % "jooq"                        % "3.19.10",
  "org.postgresql"      % "postgresql"                  % "42.7.4",
  "com.h2database"      % "h2"                          % "2.2.224",
  "org.flywaydb"        % "flyway-core"                 % "10.10.0",
  "org.flywaydb"        % "flyway-database-postgresql"  % "10.10.0",
  "com.zaxxer"          % "HikariCP"                    % "5.1.0"
)

// Main class configuration
Compile / mainClass := Some("com.metropolisparking.Main")

// Scalac compiler options
scalacOptions ++= Seq(
  "-deprecation",
  "-feature",
  "-unchecked",
  "-Xfatal-warnings",
  "-encoding", "utf8",
  "-Wconf:msg=scala/bug#7014:s"
)

// Assembly packaging options for sbt-assembly
assembly / assemblyMergeStrategy := {
  case PathList("META-INF", "services", xs @ _*) => MergeStrategy.concat
  case PathList("META-INF", xs @ _*) =>
    xs.map(_.toLowerCase) match {
      case "manifest.mf" :: Nil => MergeStrategy.discard
      case x if x.endsWith(".sf") || x.endsWith(".dsa") || x.endsWith(".rsa") => MergeStrategy.discard
      case _ => MergeStrategy.first
    }
  case "reference.conf" => MergeStrategy.concat
  case _ => MergeStrategy.first
}

// Disable parallel execution of tests to avoid race conditions on global System properties
Test / parallelExecution := false

