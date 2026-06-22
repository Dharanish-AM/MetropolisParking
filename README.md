# Metropolis Parking Backend Service

Welcome to **Metropolis Parking**, a production-ready Scala backend foundation built following global enterprise standards. This service provides the core skeleton, configuration mechanics, routing infrastructure, and deployment setups for the parking management platform.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture Overview](#architecture-overview)
3. [Project Structure](#project-structure)
4. [Technology Stack](#technology-stack)
5. [Prerequisites](#prerequisites)
6. [Local Setup Instructions](#local-setup-instructions)
7. [Docker Setup Instructions](#docker-setup-instructions)
8. [Health Endpoint Usage](#health-endpoint-usage)
9. [Environment Variables](#environment-variables)
10. [Git Repository Branching Strategy](#git-repository-branching-strategy)
11. [CI Pipeline Overview](#ci-pipeline-overview)

---

## Project Overview

Metropolis Parking is an API-first microservice designed to support scalable parking management. Deliver 1 delivers the **production-ready architecture framework**, featuring:
* Environment-based configuration management via PureConfig.
* Structured logging via Logback/SLF4J.
* Strict layered design (Controllers -> Services -> Repositories -> Models).
* Containerization using Docker and Docker Compose.
* CI pipeline integration using GitHub Actions.

---

## Architecture Overview

This project employs a **Clean Layered Architecture** with unidirectional data flow:
1. **HTTP Routes**: `com.metropolisparking.routes` - Defines endpoint mapping, HTTP status returns, and JSON Marshalling using Spray JSON.
2. **Business Services**: `com.metropolisparking.services` - Hosts the core logic (defined as traits to isolate execution details).
3. **Data Repositories**: `com.metropolisparking.repositories` - Abstracted storage interfaces to manage database queries.
4. **Data Models**: `com.metropolisparking.models` - Core representation objects with zero external code dependencies.
5. **Bootstrapper/Wiring**: `com.metropolisparking.Main` - Bootstraps the application, loads configuration, injects mock/concrete layers, and binds the HTTP engine.

---

## Project Structure

```text
MetropolisParking/
├── .github/workflows/ci.yml         # GitHub Actions pipeline
├── docs/Design-Walkthrough.md       # Software architecture design documents
├── project/
│   ├── build.properties             # Locks SBT version to 1.10.7
│   └── plugins.sbt                  # Registers assembly and native-packager plugins
├── src/
│   ├── main/
│   │   ├── resources/
│   │   │   ├── application.conf     # Base configuration settings
│   │   │   ├── application-local.conf # Local execution overrides
│   │   │   ├── application-dev.conf # Dev staging overrides
│   │   │   ├── application-test.conf# Testing environment overrides
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
│       └── routes/
│           └── HealthRouteSpec.scala # Route integration tests via ScalaTest
├── build.sbt                        # Main project configuration & dependencies
├── Dockerfile                       # Multi-stage Docker packaging recipe
└── docker-compose.yml               # Container deployment Orchestrator
```

---

## Technology Stack

* **Language**: Scala `2.13.18`
* **Build System**: SBT `1.10.7`
* **HTTP Framework**: Apache Pekko HTTP `1.1.0` (Apache 2.0 open-source alternative to Akka HTTP)
* **Configuration Loader**: PureConfig `0.17.8` (wraps Lightbend Config)
* **Logging Library**: Logback `1.5.16` + SLF4J `2.0.16`
* **Testing Library**: ScalaTest `3.2.19` + Pekko HTTP Testkit `1.1.0`
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
   Ensure all compilation and route assertions pass:
   ```bash
   sbt test
   ```

3. **Start the application locally**:
   By default, this runs using the `local` configuration profile (port `8080`):
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
   This runs the multi-stage build, compiles your application inside the builder image, generates the executable jar, and runs it on a lightweight JRE runtime:
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
| `APP_ENV` | Selection profile: `local`, `dev`, `test`, `production` | `production` | Loaded by `AppConfig.scala` |
| `HTTP_HOST` | Network interface to bind the HTTP server to | `0.0.0.0` | `application.conf` |
| `HTTP_PORT` | Port number to expose the HTTP server on | `8080` | `application.conf` |

---

## Git Repository Branching Strategy

Metropolis Parking uses the Gitflow-based branching strategy:

### Branch Structure
1. **`main`**: Represents the current production-ready release state. Direct pushes are disabled. Code enters only via approved PRs from `develop`.
2. **`develop`**: The main integration branch for development. Feature branches are merged here.
3. **`feature/*`**: Used for developing new features, fixes, or tasks (e.g., `feature/health-endpoint`, `feature/database-migration`).

### Branching Naming Examples
* New Feature: `feature/spot-allocation`
* Defect Fix: `bugfix/ticket-calculation-rounding`
* Configuration Refactor: `chore/logback-updates`

### Pull Request & Release Workflow
* Develop features in local `feature/*` branches.
* Push branches and open a Pull Request (PR) against `develop`.
* Opening a PR triggers the **GitHub Actions CI workflow** to ensure the code compiles and all tests pass.
* Once tests pass and code is reviewed by peers, merge the PR into `develop`.
* When preparing a milestone submission (e.g. Deliver 1), merge `develop` into `main` via a Release Pull Request and tag the release version (e.g. `v0.1.0`).

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
* **Enforcements**: The pipeline fails if compile errors are detected or if any ScalaTest asserts fail.
