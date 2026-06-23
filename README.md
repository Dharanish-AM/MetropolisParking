# Metropolis Parking Backend Service

Welcome to **Metropolis Parking**, a Scala backend scaffold for a parking management service. The current codebase provides the application bootstrap, configuration loading, a health-check endpoint, and the initial project structure for future parking features.

---

## Project Overview

Metropolis Parking is an API-first backend project intended to grow into a parking management service. The current deliverable provides the initial service skeleton, featuring:
* Environment-based configuration management via PureConfig.
* Structured logging via Logback/SLF4J.
* Initial layered package structure (Routes -> Services -> Repositories -> Models).
* Containerization using Docker and Docker Compose.
* CI pipeline integration using GitHub Actions.
* A single implemented HTTP endpoint: `GET /health`.

---

## Architecture Overview

This project is organized around a **layered architecture** with unidirectional data flow as the intended design:
1. **HTTP Routes**: `com.metropolisparking.routes` - Defines endpoint mapping, HTTP status returns, and JSON marshalling using Spray JSON.
2. **Business Services**: `com.metropolisparking.services` - Currently traits only; intended to host business logic.
3. **Data Repositories**: `com.metropolisparking.repositories` - Currently traits only; intended to abstract persistence.
4. **Data Models**: `com.metropolisparking.models` - Core representation objects with zero external code dependencies.
5. **Bootstrapper/Wiring**: `com.metropolisparking.Main` - Loads configuration and binds the HTTP server.

At present, only the route layer is active at runtime through the health endpoint. The service and repository layers are scaffolding for later features.

---

## Project Structure

```text
MetropolisParking/
├── .github/workflows/ci.yml         # GitHub Actions pipeline
├── docs/Design-Walkthrough.md       # Software architecture design documents
├── project/
│   ├── build.properties             # Locks SBT version to 1.10.7
│   └── plugins.sbt                  # Registers the assembly plugin
├── src/
│   ├── main/
│   │   ├── resources/
│   │   │   ├── application.conf     # Base configuration settings
│   │   │   ├── application-local.conf # Local execution overrides
│   │   │   ├── application-dev.conf # Dev staging overrides
│   │   │   ├── application-test.conf# Testing environment overrides
│   │   │   ├── application-production.conf # Production environment overrides
│   │   │   └── logback.xml          # Logging pattern configuration
│   │   └── scala/com/metropolisparking/
│   │       ├── Main.scala           # App Entry Point & graceful shutdown hook
│   │       ├── config/
│   │       │   └── AppConfig.scala  # Config representation using PureConfig
│   │       ├── models/
│   │       │   └── ParkingModels.scala # Case classes for domain models
│   │       ├── repositories/
│   │       │   └── ParkingRepository.scala # Repository abstraction layer
│   │       ├── routes/
│   │       │   └── HealthRoute.scala   # HTTP API health routes
│   │       └── services/
│   │           └── ParkingService.scala# Business logic service traits
│   └── test/scala/com/metropolisparking/
│       ├── config/
│       │   └── AppConfigSpec.scala  # Configuration loading tests
│       └── routes/
│           └── HealthRouteSpec.scala # Route integration tests
├── build.sbt                        # Main project configuration & dependencies
├── Dockerfile                       # Multi-stage Docker packaging recipe
└── docker-compose.yml               # Container deployment Orchestrator
```

---

## Technology Stack

* **Language**: Scala `2.13.18`
* **Build System**: SBT `1.10.7`
* **HTTP Framework**: Akka HTTP `10.2.10`
* **Configuration Loader**: PureConfig `0.17.8` (wraps Lightbend Config)
* **Logging Library**: Logback `1.5.16`
* **Testing Library**: ScalaTest `3.2.19` + Akka HTTP Testkit `10.2.10`
* **Containers**: Docker Engine & Docker Compose

---

## Prerequisites

Ensure you have the following installed on your system:
* **Java Development Kit (JDK)**: Java 17 (e.g., Eclipse Temurin)
* **SBT**: Scala Build Tool (installed locally)
* **Docker & Docker Compose**: For containerized runs

---

## Local Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd MetropolisParking
   ```

2. **Run tests locally**:
   This currently runs the compile path and the existing route test for `/health`:
   ```bash
   sbt test
   ```

3. **Start the application locally**:
   By default, this runs using the `local` configuration profile on port `8080`:
   ```bash
   sbt run
   ```
   To run under a different configuration profile, pass the `APP_ENV` environment variable:
   ```bash
   # Linux/macOS
   APP_ENV=dev sbt run

   # Windows (PowerShell)
   $env:APP_ENV="dev"; sbt run
   ```

---

## Docker Setup Instructions

1. **Build and start the application container**:
   This runs the multi-stage build, compiles the application inside the builder image, generates the executable jar, and runs it on a lightweight JRE runtime:
   ```bash
   docker compose up -d --build
   ```

2. **Check container status**:
   Ensure the container is online:
   ```bash
   docker ps
   ```

3. **View container logs**:
   ```bash
   docker logs metropolis-parking-service
   ```

4. **Stop the container**:
   ```bash
   docker compose down
   ```

---

## Health Endpoint Usage

The service exposes a standard health endpoint to verify application operational state.

### GET /health

**Request**:
```bash
curl -i http://localhost:8080/health
```

**Response**:
* **HTTP Status**: `200 OK`
* **Content-Type**: `application/json`
* **Response Body**:
  ```json
  {
    "status": "UP"
  }
  ```

---

## Environment Variables

The application configures itself at startup using the following environment variables:

| Variable Name | Purpose | Default Value | Config File |
|---|---|---|---|
| `APP_ENV` | Selects the config profile: `local`, `dev`, `test`, or `production` | `local` | Loaded by `AppConfig.scala` |
| `HTTP_HOST` | Network interface to bind the HTTP server to | `0.0.0.0` | `application.conf` |
| `HTTP_PORT` | Port number to expose the HTTP server on | `8080` | `application.conf` |

Notes:
* `AppConfig.scala` loads `application-${APP_ENV}.conf`.
* The repository currently contains `application-local.conf`, `application-dev.conf`, `application-test.conf`, and `application-production.conf`.
* Invalid `APP_ENV` values fail fast during startup with a clear error message.

---

## CI Pipeline Overview

The Continuous Integration (CI) pipeline is powered by GitHub Actions (`.github/workflows/ci.yml`):
* **Triggers**: Executes on push and PR triggers targeting `main` and `develop` branches.
* **Architecture**: Runs on `ubuntu-latest` and sets up `temurin` JDK 17.
* **Caching**: Caches `sbt` and `ivy2` folders, keeping execution cycles short.
* **Action Steps**:
  1. Clones repo.
  2. Sets up JDK.
  3. Compiles code (`sbt compile Test/compile`).
  4. Runs tests (`sbt test`).
* **Current coverage**: The automated test suite currently includes the `/health` route test.
* **Enforcements**: The pipeline fails if compile errors are detected or if any ScalaTest asserts fail.
