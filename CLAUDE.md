# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

MetropolisParking is a monorepo smart-parking platform: a Scala 2.13 + Akka HTTP backend (`/backend`) and a React 19 + Vite + TypeScript frontend (`/frontend`), backed by PostgreSQL (via jOOQ + Flyway) and Redis, with a full observability stack (Prometheus, Grafana, Loki/Promtail, Jaeger) wired through `docker-compose.yml`.

Full spec: `docs/MetropolisParking-Full-Project.md`. Deep architecture/ERD/C4: `docs/MetropolisParking-Enterprise-Design.md`. Live delivery status: `PROJECT_TRACKER.md`.

## Commands

### Backend (`/backend`, sbt)
```bash
docker compose up -d db redis      # dependencies for local backend dev
sbt run                            # start Akka HTTP server on :8080 (Flyway migrates on startup)
sbt compile
sbt test                           # full suite (82 tests / 19 specs) — requires db container running
sbt "testOnly *AnprServiceSpec"    # run a single spec
```

### Frontend (`/frontend`, npm)
```bash
npm install
npm run dev                        # Vite dev server on :5174
npm run build                      # tsc -b && vite build
npm run lint                       # oxlint
npm run format / format:check      # prettier
npm run test                       # vitest run (24 tests / 13 specs)
npm run test:watch
npx playwright install chromium    # first-time E2E setup
npm run test:e2e                   # Playwright, requires backend :8080 + frontend :5174 running
npm run test:e2e:ui
npx playwright test e2e/auth.spec.ts   # run a single E2E spec
npx vitest run src/features/Payments.test.tsx   # run a single vitest spec
```
lint-staged runs `oxlint` + `prettier` on staged `.ts/.tsx` via husky pre-commit.

### Full stack / load test
```bash
docker compose up --build          # backend, frontend, db, redis, prometheus, grafana, loki, promtail, jaeger
Get-Content .\scripts\k6-load-test.js | docker run --rm -i --net=host grafana/k6 run -   # PowerShell
```

## Architecture

### Backend layering (`backend/src/main/scala/com/metropolisparking/`)
Strict one-way dependency flow — do not skip layers or reach across them:
```
routes/        request parsing, validation dispatch, response serialization ONLY — no business logic
services/      all business logic, computations, orchestration, cross-entity rules
repositories/  jOOQ database access and transaction boundaries — no business logic
models/        clean domain case classes — no framework/jOOQ/HTTP dependencies
validation/    standalone input validation, invoked from routes before services
middleware/    CORS, RBAC gating, structured/MDC request logging
security/      BCrypt hashing, JWT signing/verification
exceptions/    global handler mapping errors to JSON {code, message, timestamp}
dto/           API request/response shapes, distinct from models/
jooq/          generated DB access code (do not hand-edit)
utils/         MDC correlation-id helpers, scheduler/cron tasks
telemetry/     OpenTelemetry instrumentation
```
`Main.scala` is the bootstrap entrypoint. Flyway migrations live in `src/main/resources/db/migration/` as sequential `V1__..sql`..`V13__..sql`; never edit an applied migration, add a new `Vn__` file instead.

### Frontend layering (`frontend/src/`)
```
pages/       compose features/layouts only — no API calls, no business logic
features/    own their components, hooks, and local state slices (Dashboard, Grid, ANPR, Payments, etc.)
api/         single Axios instance + interceptors; all server state goes through TanStack Query
components/  stateless, reusable UI primitives
schemas/     Zod schemas used with React Hook Form
context/     React context providers (e.g. AuthContext — most feature components read from it)
```
Modals/dialogs must render via `createPortal(..., document.body)` so fixed overlays escape container transforms/animations and cover sticky headers.
Space status colors are fixed: `AVAILABLE`→green, `OCCUPIED`→red, `RESERVED`→amber, `OUT_OF_SERVICE`→gray.

### Real-time & background flows
- WebSocket occupancy feed: Akka Streams pipeline broadcasts `SPACE_STATUS_MUTATED` JSON events over `ws://localhost:8080/ws/occupancy`; frontend uses it to invalidate TanStack Query caches, not as the source of truth.
- Background cron (Akka scheduler in `utils/`) auto-expires stale reservations.
- Redis caches aggregated dashboard analytics.
- ANPR (`/anpr/entry`, `/anpr/exit`) and QR pass flows (`/qr/generate` — role `CUSTOMER`, not `ADMIN`) drive check-in/checkout the same way manual session start/end does — same services underneath.

### Auth
Stateless JWT (HMAC-SHA256, `java-jwt`) with two roles, `ADMIN` and `CUSTOMER`, enforced per-route by RBAC middleware. Passwords hashed with jBCrypt.

## Known gotchas

- **AnprServiceSpec**: payment status assertion must be `"SUCCESS"`, not `"COMPLETED"`; missing lot throws `NotFoundException`, not `BadRequestException`.
- **ReservationService**: `wsService` can be `null` in test context — always guard `if (wsService != null) wsService.broadcast(...)` before calling it.
- **QrRoutesSpec**: `POST /qr/generate` requires role `CUSTOMER`.
- **Frontend specs**: wrap components under test in `<AuthContext.Provider value={mockAuth}>`; MSW handlers must cover every endpoint the component calls or the fetch fails silently.
- **anpr_simulator.spec.ts (Playwright)**: target a lot with `AVAILABLE` spaces or you get `409 Conflict`; select the lot by label text, not index; test plate `MH12AB1234`.
- **PowerShell**: no `&&` — use `;` to chain commands. Literal `$` in double-quoted strings passed to `psql -c "..."` (e.g. BCrypt hashes) get expanded as empty PowerShell variables — backtick-escape every `$`, or pipe the SQL via stdin instead.
- **Container changes**: after editing code/config that a container consumes, `docker compose up --build` to pick it up.
- Seed BCrypt hashes for `admin@metropolisparking.com` / `customer@metropolisparking.com` live in `V2__create_roles.sql` and the seed migration — see `.agents/skills/metropolisparking-test-patterns/SKILL.md` for the actual hash values.

## Conventions

- No code comments unless explicitly requested, in backend, frontend, or config files.
- New Flyway migrations follow `Vn__description.sql`, sequential, never mutate a filename/checksum once applied (reset via `docker compose down -v` locally if validation fails after an edit).
