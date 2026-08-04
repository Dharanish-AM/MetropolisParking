---
name: metropolisparking-test-patterns
description: Reusable patterns and known gotchas specific to the MetropolisParking test suite — ScalaTest backend specs, Vitest frontend specs, Playwright E2E flows, and BCrypt seed data.
---

# MetropolisParking Test Patterns

## Backend — Known Spec Gotchas

### AnprServiceSpec
- Payment status assertion must be `"SUCCESS"` (not `"COMPLETED"`).
- Exception thrown for a missing lot is `NotFoundException`, not `BadRequestException`.

### ReservationService / ReservationServiceSpec
- `wsService` is injected and can be `null` in test context.
- Always use the null-guard `broadcast` helper before calling `wsService.broadcast(...)`:
  ```scala
  private def broadcast(event: JsValue): Unit =
    if (wsService != null) wsService.broadcast(event)
  ```

### QrRoutesSpec
- QR token generation (`POST /qr/generate`) requires role `"CUSTOMER"`, not `"ADMIN"`.

## Backend — Spec File Inventory

**Service Specs** (unit, with Mockito mocks):
- `AnprServiceSpec`, `PaymentServiceSpec`, `QrServiceSpec`, `ReservationServiceSpec`, `VehicleServiceSpec`

**Route Specs** (integration, with Akka HTTP TestKit):
- `AnprRoutesSpec`, `ParkingLotRoutesSpec`, `ParkingSessionRoutesSpec`, `ParkingSpaceRoutesSpec`
- `PaymentRoutesSpec`, `QrRoutesSpec`, `RbacMiddlewareSpec`, `ReservationRoutesSpec`, `VehicleRoutesSpec`

**Helpers**: `TestDbSpec` (DB lifecycle), `TestFixtures` (object factory), `BaseRoutesSpec` (route test base)

## Frontend — Known Spec Gotchas

- Always wrap components under test in `<AuthContext.Provider value={mockAuth}>` — most feature components read from context.
- MSW handlers must cover all endpoints a component calls; missing handlers cause silent fetch failures in Vitest.

## Frontend — Spec File Inventory

`AuthContext.test.tsx`, `ProtectedRoute.test.tsx`, `AdminDashboard.test.tsx`, `CustomerDashboard.test.tsx`,
`ParkingLots.test.tsx`, `SessionsFeature.test.tsx`, `ReservationsFeature.test.tsx`, `PaymentsFeature.test.tsx`, `VehiclesFeature.test.tsx`

## Playwright E2E — Known Gotchas

### ANPR Simulator (`anpr_simulator.spec.ts`)
- `AnprService.simulateEntry` checks for `AVAILABLE` spaces in the target lot.
- If all spaces are `OCCUPIED` → `409 Conflict`. **Always target a lot that has available spaces**.
- Select the target lot by **label text** (e.g. `"Payment E2E Lot"`), not by index or value.
- Test plate: `MH12AB1234`.

## BCrypt Seed Credentials

Valid pre-computed BCrypt hashes for Flyway migration seed data and live DB updates:

| Email | Password | BCrypt Hash |
|---|---|---|
| `admin@metropolisparking.com` | `admin123` | `$2a$10$lM5RrT7xN7WIK0xSFvGz9.Ti.mEya.AJjVpTPlXhAkz0IYvSdI9jy` |
| `customer@metropolisparking.com` | `customer123` | `$2a$10$8stReEqYYBpgFJiOIVhsj.hXdKr/XmdVGkKyvBzM948fmBcfGI1ee` |

These hashes are used in `V2__create_roles.sql` and `V12__seed_production_data.sql`.

## Running Tests

```bash
# Backend (82 tests, 19 specs)
docker compose up -d db
cd backend; sbt test

# Frontend (24 tests, 13 specs)
cd frontend; npm run test

# Playwright E2E (32+ scenarios, 10 specs)
cd frontend; npx playwright install chromium; npm run test:e2e

# k6 load benchmark (50 VUs, 60s)
Get-Content .\scripts\k6-load-test.js | docker run --rm -i --net=host -e BASE_URL="http://localhost:8080" grafana/k6 run -
```
