# MetropolisParking - Workspace Rules and Instructions

You are tasked with building the **MetropolisParking** system from scratch. Refer to [MetropolisParking-Full-Project.md](file:///Users/dharanisham/Developer/Github-Repositories/MetropolisParking/docs/MetropolisParking-Full-Project.md) for full details. Follow these rules and constraints strictly throughout the development.

## 1. Global Coding & Design Rules
- **No Comments:** Do not write code comments in any backend, frontend, or configuration files unless explicitly requested by the user. Keep the code clean and self-explanatory.
- **Monorepo Layout:**
  - Backend must be in `/backend`.
  - Frontend must be in `/frontend`.
  - Configuration files for docker compose must reside at the root.

## 2. Backend Rules (Scala + Akka HTTP)
- Use Scala 2.13 and Java 17.
- **Architecture Layers:**
  - **Routes:** Only request parsing, validation, and response serialization.
  - **Services:** All business logic, computations, validations, and orchestration.
  - **Repositories:** Exclusively jOOQ-based database access and transaction boundary control.
  - **Models:** Clean domain case classes with no framework, jOOQ, or HTTP dependencies.
- **Validation:** Standardized input validation in a dedicated module before processing request in services.
- **Error Handling:** Global exception handling producing JSON error responses with standard error codes (e.g., `code`, `message`, `timestamp`).

## 3. Frontend Rules (React 18 + Vite + TS)
- Use TypeScript with strict configuration.
- **Architecture Layers:**
  - **Pages:** Colocated in `src/pages/`, only compose features and layouts. No API calls or business logic.
  - **Features:** Colocated in `src/features/`. They own their own components, state slices, hooks.
  - **API Layer:** Axios instance under `src/api/` with request/response interceptors. Server state must be cached using TanStack Query.
- **Styling:** Tailwind CSS with status-based colors (AVAILABLE -> green, OCCUPIED -> red, RESERVED -> amber, OUT_OF_SERVICE -> gray).

## 4. Database & Infrastructure
- PostgreSQL as database.
- Flyway for schema migrations named sequentially (e.g., `V1__create_users.sql`).
- Docker Compose configuration orchestrating backend, frontend, database, and migrations.
