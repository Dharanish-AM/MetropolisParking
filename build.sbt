name := "metropolis-parking"

version := "0.1.0-SNAPSHOT"

scalaVersion := "2.13.18"

val PekkoVersion = "1.1.2"
val PekkoHttpVersion = "1.1.0"
val PureConfigVersion = "0.17.8"
val LogbackVersion = "1.5.16"
val ScalaTestVersion = "3.2.19"

libraryDependencies ++= Seq(
  // Apache Pekko (HTTP & Streaming Engine)
  "org.apache.pekko" %% "pekko-http"            % PekkoHttpVersion,
  "org.apache.pekko" %% "pekko-http-spray-json" % PekkoHttpVersion,
  "org.apache.pekko" %% "pekko-actor-typed"     % PekkoVersion,
  "org.apache.pekko" %% "pekko-stream"          % PekkoVersion,
  
  // Configuration management using PureConfig
  "com.github.pureconfig" %% "pureconfig"       % PureConfigVersion,
  
  // Logging: Logback with SLF4J
  "ch.qos.logback" % "logback-classic"          % LogbackVersion,
  "org.slf4j"      % "slf4j-api"                % "2.0.16",
  
  // Testing toolkit
  "org.apache.pekko" %% "pekko-http-testkit"        % PekkoHttpVersion % Test,
  "org.apache.pekko" %% "pekko-actor-testkit-typed" % PekkoVersion     % Test,
  "org.scalatest"    %% "scalatest"                 % ScalaTestVersion % Test
)

// Main class configuration
Compile / mainClass := Some("com.metropolisparking.Main")

// Scalac compiler options
scalacOptions ++= Seq(
  "-deprecation",
  "-feature",
  "-unchecked",
  "-Xfatal-warnings",
  "-encoding", "utf8"
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
