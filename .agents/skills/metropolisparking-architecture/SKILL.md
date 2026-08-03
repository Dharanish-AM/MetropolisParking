---
name: metropolisparking-architecture
description: Layered architecture patterns, test conventions, and database interaction guidelines for MetropolisParking (Scala/Akka HTTP + React/TS).
---

# MetropolisParking Architecture Guidelines

## Architecture Overview

1. **Backend (Scala 2.13 + Akka HTTP + jOOQ)**:
   - **Routes Layer**: In `src/main/scala/com/metropolisparking/routes/`. Performs request parsing, JSON spray-json serialization, validation checks, and RBAC authentication headers using `RbacMiddleware`. Does NOT execute direct DB queries or business computations.
   - **Services Layer**: In `src/main/scala/com/metropolisparking/services/`. Implements business logic, fee calculations, time validation, space allocation, transaction orchestration, and audit logging (`AuditLogService`).
   - **Repositories Layer**: In `src/main/scala/com/metropolisparking/repositories/`. Exclusively jOOQ DSLContext queries and transaction boundaries (`transaction { txDsl => ... }`).
   - **Models & DTOs**: Case classes in `com.metropolisparking.models` and DTOs in `com.metropolisparking.dto`. Clean domain models with no framework dependencies.

2. **Frontend (React 18 + Vite + TypeScript)**:
   - **Pages**: In `src/pages/`. Only compose layouts and top-level features. No direct API calls or state mutations.
   - **Features**: In `src/features/`. Owned feature modules with components, custom React Query hooks (`useLots`, `useSessions`, `useReservations`), and form schemas (Zod + React Hook Form).
   - **API Layer**: Centralized Axios instance under `src/api/client.ts` handling JWT bearer headers and 401 logouts. MSW handlers in `src/test/mocks/handlers.ts` for unit testing.

## Code Style Rules (Mandatory)
- **Strictly NO Code Comments**: Do not write code comments in backend Scala, frontend TSX, or migration SQL files unless explicitly requested by the user. Keep code self-explanatory.
- **Error Handling**: Global exception handler (`ExceptionHandlerModule`) converting domain exceptions (`NotFoundException`, `ConflictException`, `ValidationException`) into JSON error envelopes `{ "code": "...", "message": "...", "timestamp": "..." }`.

## Testing Conventions
- **Backend Specs**: Extend `TestDbSpec` for database rollbacks and use `BaseRoutesSpec` for Akka HTTP route testing with `authHeader(userId, role)`.
- **Frontend Specs**: Wrap components with `QueryClientProvider` and `AuthContext.Provider` (mocked with ADMIN or CUSTOMER role) and test against MSW endpoints.
