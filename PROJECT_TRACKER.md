# MetropolisParking — Master Tracker

**Status legend**

| Symbol | Meaning |
|---|---|
| ⬜ Not Started | No code/config exists yet |
| 🟡 In Progress | Partially implemented, not yet verified |
| ✅ Verified | Implemented AND passed all checks in the Operating Prompt |
| 🔴 Blocked | Cannot proceed — reason logged below |

*(Claude: update the Status and Notes columns in place as work happens. Do not delete rows. Add new rows for discovered work under the correct phase.)*

### Phase 0 — Project Bootstrap

| # | Task | Status | Notes |
|---|---|---|---|
| 0.1 | Initialize backend SBT project structure per §7 | ✅ Verified | SBT, project folder, build.sbt, plugins.sbt, build.properties, Main.scala created & compiled |
| 0.2 | Initialize frontend Vite + React + TS project per §31 | ✅ Verified | Vite React + TS scaffolding set up, custom package.json, tailwind config, and tsconfig app configured |
| 0.3 | Set up monorepo root (`docker-compose.yml`, `.github/workflows/`, `README.md`) per §45 | ✅ Verified | Root docker-compose, CI workflow, and README created |
| 0.4 | PostgreSQL local instance + connection config | ✅ Verified | Local Postgres container started and verified healthy |
| 0.5 | `.env.example` for backend and frontend | ✅ Verified | Backend and frontend configuration templates provided |

### Phase 1 — Database & Migrations (§20)

| # | Task | Status | Notes |
|---|---|---|---|
| 1.1 | V1 — `users` table | ⬜ | |
| 1.2 | V2 — `roles` table | ⬜ | |
| 1.3 | V3 — `parking_lots` table | ⬜ | |
| 1.4 | V4 — `parking_levels` table | ⬜ | |
| 1.5 | V5 — `parking_spaces` table | ⬜ | |
| 1.6 | V6 — `vehicles` table | ⬜ | |
| 1.7 | V7 — `parking_sessions` table | ⬜ | |
| 1.8 | V8 — `pricing_rules` table | ⬜ | |
| 1.9 | V9 — `payments` table | ⬜ | |
| 1.10 | V10 — `audit_logs` table | ⬜ | |
| 1.11 | Flyway wired into app startup + Docker | ⬜ | |

### Phase 2 — Backend Core Infrastructure

| # | Task | Status | Notes |
|---|---|---|---|
| 2.1 | PureConfig setup + environment profiles (§16) | ⬜ | |
| 2.2 | HikariCP + jOOQ codegen/config | ⬜ | |
| 2.3 | Logback + SLF4J structured logging w/ correlation IDs (§17) | ⬜ | |
| 2.4 | Global exception handler + error response shape (§18) | ⬜ | |
| 2.5 | Request validation framework (§19) | ⬜ | |
| 2.6 | JWT + BCrypt security module (§14) | ⬜ | |
| 2.7 | RBAC middleware (ADMIN/OPERATOR/CUSTOMER) | ⬜ | |
| 2.8 | Health check endpoint `GET /health` | ⬜ | |

### Phase 3 — Backend Domain Modules

| # | Task | Status | Notes |
|---|---|---|---|
| 3.1 | Auth: `POST /auth/login`, `POST /auth/logout`, `GET /me` | ⬜ | |
| 3.2 | User management: registration, profile, roles, permissions | ⬜ | |
| 3.3 | Parking Lots CRUD (§13) | ⬜ | |
| 3.4 | Parking Levels (multi-floor support) | ⬜ | |
| 3.5 | Parking Spaces CRUD + status transitions | ⬜ | |
| 3.6 | Vehicle registration + lookup + history | ⬜ | |
| 3.7 | Session start/end + fee calculation | ⬜ | |
| 3.8 | Pricing engine (hourly/daily/flat/dynamic/peak) | ⬜ | |
| 3.9 | Payments (cash/card/UPI/wallet) + status lifecycle | ⬜ | |
| 3.10 | Dashboard aggregation endpoint | ⬜ | |
| 3.11 | Audit logging on critical operations | ⬜ | |
| 3.12 | Business rules enforcement (§15): one active session/vehicle, no double-booking, soft deletes | ⬜ | |

### Phase 4 — Backend Quality & Ops

| # | Task | Status | Notes |
|---|---|---|---|
| 4.1 | Unit tests: services, utils, validation | ⬜ | |
| 4.2 | Integration tests: repositories, DB, routes | ⬜ | |
| 4.3 | E2E tests: auth, parking workflow, payments | ⬜ | |
| 4.4 | GitHub Actions CI pipeline (§22) | ⬜ | |
| 4.5 | Dockerfile + docker-compose for backend (§23) | ⬜ | |
| 4.6 | Monitoring: health/metrics endpoints, JVM/DB metrics (§25) | ⬜ | |

### Phase 5 — Frontend Core Infrastructure

| # | Task | Status | Notes |
|---|---|---|---|
| 5.1 | App shell, router, Redux store wiring (§32) | ⬜ | |
| 5.2 | Axios client + interceptors (auth token, 401 handling) (§36) | ⬜ | |
| 5.3 | React Query setup + base hooks pattern | ⬜ | |
| 5.4 | Tailwind config + design tokens/status colors (§38) | ⬜ | |
| 5.5 | UI primitive library (Button, Input, Modal, Table, etc.) | ⬜ | |
| 5.6 | `ProtectedRoute` + role-based route gating (§33, §37) | ⬜ | |
| 5.7 | Auth flow: login page, session hydration via `/me` | ⬜ | |

### Phase 6 — Frontend Feature Modules

| # | Task | Status | Notes |
|---|---|---|---|
| 6.1 | Dashboard page + charts (occupancy, revenue, peak hours) | ⬜ | |
| 6.2 | Parking Lots list + detail + form (CRUD) | ⬜ | |
| 6.3 | Parking Spaces management + status grid | ⬜ | |
| 6.4 | Vehicle registry + lookup + history view | ⬜ | |
| 6.5 | Sessions list + detail + start/end flows | ⬜ | |
| 6.6 | Payments list + detail | ⬜ | |
| 6.7 | User profile page | ⬜ | |
| 6.8 | Forms: React Hook Form + Zod schemas mirroring backend validation (§39) | ⬜ | |

### Phase 7 — Frontend Quality & Ops

| # | Task | Status | Notes |
|---|---|---|---|
| 7.1 | Unit/component tests (Vitest + RTL) | ⬜ | |
| 7.2 | Integration tests w/ MSW mocked API | ⬜ | |
| 7.3 | Playwright E2E: login → session → payment flow | ⬜ | |
| 7.4 | ESLint + Prettier + Husky pre-commit hooks | ⬜ | |
| 7.5 | Frontend Dockerfile + Nginx config (§43, §47) | ⬜ | |

### Phase 8 — Integration & Launch

| # | Task | Status | Notes |
|---|---|---|---|
| 8.1 | Full docker-compose up: backend + frontend + postgres + flyway (§47) | ⬜ | |
| 8.2 | End-to-end manual smoke test of every API endpoint from the UI | ⬜ | |
| 8.3 | CORS/reverse-proxy verified in containerized mode | ⬜ | |
| 8.4 | README with setup instructions for both backend and frontend | ⬜ | |
| 8.5 | Final pass against MetropolisParking-Full-Project.md — confirm nothing in the spec is unimplemented | ⬜ | |

### Phase 9 — Future Enhancements (post-launch, not required for "done")

| # | Task | Status | Notes |
|---|---|---|---|
| 9.1 | ANPR/LPR | ⬜ | Deferred |
| 9.2 | QR Code Entry | ⬜ | Deferred |
| 9.3 | Reservation System | ⬜ | Deferred |
| 9.4 | Multi-tenant / multi-site support | ⬜ | Deferred |
| 9.5 | WebSocket live occupancy (§40) | ⬜ | Deferred |
| 9.6 | Kafka / Redis caching / background jobs | ⬜ | Deferred |
| 9.7 | OpenAPI/Swagger docs | ⬜ | Deferred |

---

## Decisions & Deviations Log

*(Claude appends here whenever it makes an assumption or deviates from the spec — one line each, dated.)*

- —
