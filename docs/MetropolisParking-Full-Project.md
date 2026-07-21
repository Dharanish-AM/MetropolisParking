# MetropolisParking

**Enterprise Parking Management Platform — Full Project (Backend + Frontend)**

| | |
|---|---|
| **Version** | 1.0.0 |
| **Backend** | Scala 2.13 (Akka HTTP, Layered Monolith) |
| **Frontend** | React 18 + TypeScript (SPA, Component-Driven) |
| **Architecture** | Layered Monolith Backend, Feature-Modular Frontend (Designed for Future Microservice Evolution) |

This document covers the complete MetropolisParking system: the Scala backend service (Part I) and the React frontend application (Part II) that together form the end-to-end parking management platform.

---

## Table of Contents

**Part I — Backend Service**

1. [Introduction](#1-introduction)
2. [Business Overview](#2-business-overview)
3. [Goals](#3-goals)
4. [Features](#4-features)
5. [System Architecture](#5-system-architecture)
6. [Technology Stack](#6-technology-stack)
7. [Project Structure](#7-project-structure)
8. [Module Overview](#8-module-overview)
9. [Architecture Layers](#9-layered-architecture)
10. [Request Lifecycle](#10-request-lifecycle)
11. [Domain Model](#11-domain-model)
12. [Database Design](#12-database-design)
13. [API Design](#13-api-design)
14. [Authentication & Authorization](#14-authentication--authorization)
15. [Business Rules](#15-business-rules)
16. [Configuration](#16-configuration)
17. [Logging](#17-logging)
18. [Error Handling](#18-error-handling)
19. [Validation](#19-validation)
20. [Database Migration](#20-database-migration)
21. [Testing Strategy](#21-testing-strategy)
22. [CI/CD](#22-cicd)
23. [Docker Deployment](#23-docker-deployment)
24. [Local Development](#24-local-development)
25. [Monitoring](#25-monitoring)
26. [Future Enhancements](#26-future-enhancements)
27. [Coding Standards](#27-coding-standards)
28. [Contributing](#28-contributing)

**Part II — Frontend Application**

29. [Frontend Introduction](#29-frontend-introduction)
30. [Frontend Technology Stack](#30-frontend-technology-stack)
31. [Frontend Project Structure](#31-frontend-project-structure)
32. [Application Architecture](#32-application-architecture)
33. [Routing & Pages](#33-routing--pages)
34. [Component Library](#34-component-library)
35. [State Management](#35-state-management)
36. [API Integration Layer](#36-api-integration-layer)
37. [Authentication Flow (Frontend)](#37-authentication-flow-frontend)
38. [Styling & Design System](#38-styling--design-system)
39. [Forms & Validation (Frontend)](#39-forms--validation-frontend)
40. [Real-Time Updates](#40-real-time-updates)
41. [Frontend Environment Configuration](#41-frontend-environment-configuration)
42. [Frontend Testing Strategy](#42-frontend-testing-strategy)
43. [Frontend Build & Deployment](#43-frontend-build--deployment)
44. [Frontend Coding Standards](#44-frontend-coding-standards)

**Part III — Full Project**

45. [Monorepo Project Structure](#45-monorepo-project-structure)
46. [Full-Stack Local Development](#46-full-stack-local-development)
47. [Full-Stack Docker Deployment](#47-full-stack-docker-deployment)

---

## 1. Introduction

Metropolis Parking is an enterprise-grade backend service designed to manage smart parking operations. The platform provides secure APIs for managing parking lots, parking spaces, vehicles, parking sessions, pricing, payments, and operational analytics.

The project follows a clean layered architecture that separates business logic, persistence, and HTTP concerns, making the system scalable, maintainable, and easy to evolve.

Although currently implemented as a modular monolith, the architecture has been designed to support future migration toward microservices.

---

## 2. Business Overview

The platform manages the complete lifecycle of parking operations.

Core capabilities include:

- Parking lot management
- Parking space management
- Vehicle registration
- Parking sessions
- Entry and exit operations
- Pricing calculation
- Payment processing
- Operational dashboards
- Reporting
- User management
- Audit logging

---

## 3. Goals

The primary objectives are:

- Build a production-ready backend service
- Follow enterprise software engineering practices
- Maintain clean separation of concerns
- Provide extensible APIs
- Support future scalability
- Enable automated deployments
- Ensure maintainability through modular design

---

## 4. Features

### Authentication

- User Login
- JWT Authentication
- Role Based Access Control (RBAC)
- Token Validation

### User Management

- User Registration
- User Profile
- Roles
- Permissions

### Parking Lots

- Create Parking Lot
- Update Parking Lot
- Delete Parking Lot
- List Parking Lots
- View Lot Details

### Parking Levels

- Multi-floor Support
- Floor Management

### Parking Spaces

- Create Space
- Update Space
- Disable Space
- Space Availability

Supported statuses:

- `AVAILABLE`
- `OCCUPIED`
- `RESERVED`
- `OUT_OF_SERVICE`

### Vehicle Management

- Register Vehicle
- Vehicle Lookup
- Vehicle History

Supported vehicle types:

- Car
- Bike
- SUV
- Truck
- EV

### Parking Sessions

- Start Session
- End Session
- Fee Calculation
- Active Sessions
- Parking History

### Pricing

Supports:

- Hourly Pricing
- Daily Pricing
- Flat Rate
- Dynamic Pricing
- Peak Hour Pricing

### Payments

- Cash
- Card
- UPI
- Wallet

Payment Status:

- Pending
- Success
- Failed
- Refunded

### Dashboard

Provides:

- Occupancy
- Revenue
- Active Sessions
- Available Spaces
- Peak Hours
- Average Parking Duration

---

## 5. System Architecture

```
                    Client
                      │
                      ▼
                Akka HTTP Routes
                      │
                      ▼
              Business Services
                      │
                      ▼
               Repository Layer
                      │
                      ▼
                     jOOQ
                      │
                      ▼
                PostgreSQL
```

**Supporting Infrastructure**

- Flyway
- HikariCP
- Docker
- GitHub Actions
- Logback
- PureConfig

---

## 6. Technology Stack

| Component | Technology |
|---|---|
| Language | Scala 2.13 |
| Build Tool | SBT |
| HTTP | Akka HTTP |
| JSON | Spray JSON |
| Database | PostgreSQL |
| ORM | jOOQ |
| Migrations | Flyway |
| Connection Pool | HikariCP |
| Logging | SLF4J + Logback |
| Configuration | PureConfig |
| Testing | ScalaTest |
| Containers | Docker |
| CI | GitHub Actions |

---

## 7. Project Structure

```
MetropolisParking/
├── .github/
├── docs/
├── src/
│   ├── main/
│   │   ├── scala/
│   │   │   └── com/metropolisparking/
│   │   │       ├── Main.scala
│   │   │       ├── config/
│   │   │       ├── routes/
│   │   │       ├── services/
│   │   │       ├── repositories/
│   │   │       ├── models/
│   │   │       ├── dto/
│   │   │       ├── validation/
│   │   │       ├── security/
│   │   │       ├── middleware/
│   │   │       ├── exceptions/
│   │   │       └── utils/
│   │   └── resources/
│   └── test/
├── Dockerfile
├── docker-compose.yml
└── build.sbt
```

---

## 8. Module Overview

**Config** — Application configuration.

**Routes** — HTTP endpoints.
Responsibilities: Request parsing, Validation, Response formatting. No business logic.

**Services** — Business logic.
Examples: Fee Calculation, Parking Allocation, Session Management.

**Repository** — Database interaction.
Responsibilities: CRUD, Queries, Transactions.

**Models** — Pure domain models. Independent from Database, HTTP, Frameworks.

**DTO** — Request and Response models.

**Validation** — Input validation.

**Security** — JWT, RBAC, Authentication.

**Middleware** — Cross-cutting concerns.
Examples: Logging, Correlation IDs, Request timing.

---

## 9. Layered Architecture

```
HTTP Routes
      │
      ▼
Services
      │
      ▼
Repositories
      │
      ▼
Database
```

**Rules**

- Routes never access database directly.
- Services never depend on HTTP.
- Models contain no framework code.
- Repositories contain no business logic.

---

## 10. Request Lifecycle

```
Client
  ↓
Route
  ↓
Validation
  ↓
Service
  ↓
Repository
  ↓
Database
  ↓
Repository
  ↓
Service
  ↓
Route
  ↓
Response
```

---

## 11. Domain Model

**User**
- id
- name
- email
- role

**Vehicle**
- id
- plateNumber
- type
- ownerId

**ParkingLot**
- id
- name
- location

**ParkingLevel**
- id
- lotId
- levelNumber

**ParkingSpace**
- id
- lotId
- levelId
- spaceNumber
- type
- status

**ParkingSession**
- id
- vehicleId
- spaceId
- entryTime
- exitTime
- duration
- fee

**Payment**
- id
- sessionId
- amount
- method
- status

**PricingRule**
- id
- ruleType
- rate

---

## 12. Database Design

**Main Tables**

```
users
roles
permissions
vehicles
parking_lots
parking_levels
parking_spaces
parking_sessions
pricing_rules
payments
audit_logs
```

**Relationships**

```
User
 └── Vehicles
Vehicle
 └── Parking Sessions
Parking Lot
 └── Levels
Parking Level
 └── Spaces
Parking Space
 └── Sessions
Parking Session
 └── Payment
```

---

## 13. API Design

### Authentication

```
POST /auth/login
POST /auth/logout
GET  /me
```

### Parking Lots

```
GET    /parking-lots
GET    /parking-lots/{id}
POST   /parking-lots
PUT    /parking-lots/{id}
DELETE /parking-lots/{id}
```

### Parking Spaces

```
GET  /spaces
POST /spaces
PUT  /spaces/{id}
```

### Vehicles

```
GET  /vehicles
POST /vehicles
```

### Parking Sessions

```
POST /sessions/start
POST /sessions/end
GET  /sessions
GET  /sessions/{id}
```

### Payments

```
GET  /payments
POST /payments
```

### Dashboard

```
GET /dashboard
```

### Health

```
GET /health
```

---

## 14. Authentication & Authorization

**Authentication**

- JWT Access Tokens
- Password Hashing (BCrypt)

**Authorization**

Roles:

- `ADMIN`
- `OPERATOR`
- `CUSTOMER`

Each endpoint is protected through role-based access control.

---

## 15. Business Rules

- One active parking session per vehicle.
- Parking spaces cannot be double-booked.
- Sessions calculate fees only after exit.
- Payments are linked to completed sessions.
- Deleted records are soft deleted where applicable.
- Audit logs are generated for critical operations.

---

## 16. Configuration

Environment-based configuration is managed using PureConfig.

**Profiles**

- local
- dev
- test
- production

**Key Variables**

- `APP_ENV`
- `HTTP_HOST`
- `HTTP_PORT`
- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`

---

## 17. Logging

Logging is implemented using SLF4J with Logback.

**Log Levels**

- TRACE
- DEBUG
- INFO
- WARN
- ERROR

Structured logging is recommended with request correlation IDs.

---

## 18. Error Handling

A global exception handler provides consistent API responses.

**Example**

```json
{
  "code": "PARKING_SPACE_NOT_AVAILABLE",
  "message": "Selected parking space is currently occupied.",
  "timestamp": "2026-07-21T12:00:00Z"
}
```

---

## 19. Validation

Request validation includes:

- Required fields
- String length
- Email format
- License plate format
- Enum validation
- Date validation
- Numeric ranges

---

## 20. Database Migration

Flyway manages all schema changes.

**Migration strategy**

```
V1__create_users.sql
V2__create_roles.sql
V3__create_parking_lots.sql
V4__create_parking_levels.sql
V5__create_parking_spaces.sql
V6__create_vehicles.sql
V7__create_parking_sessions.sql
V8__create_pricing_rules.sql
V9__create_payments.sql
V10__create_audit_logs.sql
```

Each migration is immutable and version-controlled.

---

## 21. Testing Strategy

**Unit Tests**

- Services
- Utilities
- Validation

**Integration Tests**

- Repository
- Database
- HTTP Routes

**End-to-End Tests**

- Authentication
- Parking workflow
- Payments

---

## 22. CI/CD

**GitHub Actions pipeline**

1. Checkout source
2. Setup JDK
3. Restore cache
4. Compile
5. Execute tests
6. Build application
7. Build Docker image

**Future enhancements**

- Code coverage
- Static analysis
- Security scanning
- Automated deployments

---

## 23. Docker Deployment

**Services**

- Backend API
- PostgreSQL
- Flyway (startup migration)

**Typical commands**

```bash
docker compose up --build
docker compose down
```

---

## 24. Local Development

**Requirements**

- Java 17
- SBT
- PostgreSQL
- Docker (optional)

**Run**

```bash
sbt run
```

**Run Tests**

```bash
sbt test
```

---

## 25. Monitoring

Recommended production integrations:

- Prometheus
- Grafana
- OpenTelemetry
- Health endpoints
- Request metrics
- JVM metrics
- Database metrics

---

## 26. Future Enhancements

- License Plate Recognition (ANPR/LPR)
- QR Code Entry
- Dynamic Pricing
- Reservation System
- Multi-Tenant Support
- Multi-Site Management
- Notification Service
- Email & SMS
- WebSocket-based Live Occupancy
- Payment Gateway Integration
- OpenAPI/Swagger Documentation
- Event-Driven Architecture
- Kafka Integration
- Redis Caching
- Background Job Processing
- Cloud Deployment (AWS/Azure/GCP)

---

## 27. Coding Standards

- Follow Scala style guidelines.
- Keep routes thin; business logic belongs in services.
- Use immutable domain models.
- Write unit tests for new features.
- Version all database changes through Flyway.
- Maintain backward-compatible APIs when possible.
- Use meaningful logging and consistent error responses.
- Document all public APIs.

---

## 28. Contributing

1. Create a feature branch.
2. Implement the feature with tests.
3. Run formatting and static analysis.
4. Ensure all tests pass.
5. Submit a pull request for review.
6. Merge only after approval and successful CI.

---

## 29. Frontend Introduction

The MetropolisParking frontend is a single-page application (SPA) that provides the operational interface for administrators, lot operators, and customers to interact with the parking platform. It consumes the backend's REST API to manage lots, spaces, vehicles, sessions, and payments, and to present real-time occupancy and revenue dashboards.

The frontend is built as a component-driven, feature-modular React application, following the same separation-of-concerns philosophy as the backend: presentation, state, and data-access are kept in distinct layers.

---

## 30. Frontend Technology Stack

| Component | Technology |
|---|---|
| Language | TypeScript |
| Framework | React 18 |
| Build Tool | Vite |
| Routing | React Router |
| State Management | Redux Toolkit |
| Server State / Caching | TanStack Query (React Query) |
| Styling | Tailwind CSS |
| UI Primitives | Radix UI / shadcn-style components |
| Forms | React Hook Form + Zod |
| HTTP Client | Axios |
| Charts | Recharts |
| Real-Time | WebSocket client (native) |
| Testing | Vitest + React Testing Library |
| E2E Testing | Playwright |
| Linting/Formatting | ESLint + Prettier |
| Package Manager | pnpm |

---

## 31. Frontend Project Structure

```
metropolis-parking-frontend/
├── public/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── router.tsx
│   │   └── store.ts
│   ├── pages/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── lots/
│   │   ├── spaces/
│   │   ├── vehicles/
│   │   ├── sessions/
│   │   └── payments/
│   ├── features/
│   │   ├── auth/
│   │   ├── lots/
│   │   ├── spaces/
│   │   ├── vehicles/
│   │   ├── sessions/
│   │   ├── payments/
│   │   └── dashboard/
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   └── shared/
│   ├── api/
│   │   ├── client.ts
│   │   ├── endpoints/
│   │   └── types/
│   ├── hooks/
│   ├── context/
│   ├── utils/
│   ├── constants/
│   ├── styles/
│   └── main.tsx
├── tests/
├── .env.example
├── index.html
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

## 32. Application Architecture

```
                    Browser
                      │
                      ▼
                React Router
                      │
                      ▼
                    Pages
                      │
                      ▼
              Feature Modules
              (components, hooks, slices)
                      │
                      ▼
        API Layer (Axios + React Query)
                      │
                      ▼
             Metropolis Parking API
                (Akka HTTP Backend)
```

**Rules**

- Pages compose features; they contain no business logic themselves.
- Feature modules own their own components, hooks, and state slices.
- Components in `components/ui` are presentational and stateless.
- All network access goes through the API layer — no direct `fetch`/`axios` calls inside components.
- Server data is cached and synchronized via React Query; Redux is reserved for client/UI state (auth session, filters, modals).

---

## 33. Routing & Pages

| Route | Page | Access |
|---|---|---|
| `/login` | Login | Public |
| `/` | Dashboard | Authenticated |
| `/lots` | Parking Lots List | ADMIN, OPERATOR |
| `/lots/:id` | Lot Details | ADMIN, OPERATOR |
| `/spaces` | Space Management | ADMIN, OPERATOR |
| `/vehicles` | Vehicle Registry | ADMIN, OPERATOR, CUSTOMER |
| `/sessions` | Active & Past Sessions | ADMIN, OPERATOR |
| `/sessions/:id` | Session Details | ADMIN, OPERATOR |
| `/payments` | Payments | ADMIN, OPERATOR |
| `/profile` | User Profile | Authenticated |
| `*` | Not Found | Public |

Route access is enforced by a `<ProtectedRoute>` wrapper that checks the authenticated user's role against the route's allowed roles before rendering.

---

## 34. Component Library

**Layout Components**

- `AppShell` — top-level frame (sidebar + header + content outlet)
- `Sidebar` — primary navigation
- `Topbar` — user menu, notifications, breadcrumbs

**UI Primitives** (`components/ui`)

- Button, Input, Select, Checkbox, Modal, Drawer, Toast, Table, Tabs, Badge, Card, Skeleton

**Feature Components** (examples)

- `LotCard`, `LotForm`, `SpaceGrid`, `SpaceStatusBadge`, `VehicleForm`, `SessionTimeline`, `PaymentTable`, `OccupancyChart`, `RevenueChart`

All feature components are colocated with their feature module rather than the global `components/` directory, keeping ownership clear.

---

## 35. State Management

| State Type | Tool | Examples |
|---|---|---|
| Server state | React Query | Lots, spaces, sessions, payments, dashboard metrics |
| Global client state | Redux Toolkit | Auth session, current role, active filters |
| Local UI state | React `useState` | Modal open/close, form step, hover state |
| Derived/computed state | Selectors / hooks | Filtered lists, formatted totals |

React Query handles caching, background refetching, and optimistic updates for mutations such as starting/ending a session. Redux Toolkit slices are kept intentionally small — primarily `authSlice` and `uiSlice`.

---

## 36. API Integration Layer

A single Axios instance (`api/client.ts`) is configured with:

- Base URL from environment configuration
- Request interceptor to attach the JWT access token
- Response interceptor to handle 401 responses (token refresh / redirect to login)
- Centralized error normalization matching the backend's error response shape

Each domain has a dedicated endpoints module and typed React Query hooks, for example:

```
api/endpoints/lots.ts        → getLots(), getLot(id), createLot(), updateLot(), deleteLot()
features/lots/hooks.ts       → useLots(), useLot(id), useCreateLot(), useUpdateLot()
```

TypeScript types under `api/types/` mirror the backend DTOs (`ParkingLot`, `ParkingSpace`, `Vehicle`, `ParkingSession`, `Payment`, etc.) to keep the frontend and backend contracts aligned.

---

## 37. Authentication Flow (Frontend)

1. User submits credentials on `/login`.
2. Frontend calls `POST /auth/login`; backend returns a JWT access token.
3. Token is stored in memory (Redux `authSlice`) and persisted via an HTTP-only cookie or secure storage, per security policy.
4. `ProtectedRoute` reads the decoded token's role claim to gate access to role-restricted routes.
5. Axios interceptor attaches `Authorization: Bearer <token>` to every request.
6. On `401 Unauthorized`, the user is redirected to `/login` and the session is cleared.
7. `GET /me` is called on app load to hydrate the current user session.

---

## 38. Styling & Design System

- Tailwind CSS utility classes as the primary styling mechanism.
- A shared design token set (spacing, radius, color palette, typography scale) defined in `tailwind.config.ts`.
- Status colors are standardized across the app for consistency:
  - `AVAILABLE` → green
  - `OCCUPIED` → red
  - `RESERVED` → amber
  - `OUT_OF_SERVICE` → gray
- Dark mode supported via Tailwind's class strategy.
- Responsive-first layout, with dashboard views optimized for desktop/tablet operator use and session/vehicle views optimized for mobile.

---

## 39. Forms & Validation (Frontend)

- React Hook Form manages form state and submission.
- Zod schemas define validation rules and are shared between form resolvers and TypeScript types, mirroring backend validation rules (required fields, license plate format, numeric ranges, enum values).
- Inline field-level error messages; form-level error banners surface backend validation failures returned from the API.

---

## 40. Real-Time Updates

- A WebSocket connection (planned, per backend's Future Enhancements) will push live occupancy and session events to the dashboard.
- Until WebSocket support lands, the dashboard falls back to React Query polling (configurable interval) for near-real-time occupancy and revenue figures.
- Toast notifications surface session start/end and payment status changes.

---

## 41. Frontend Environment Configuration

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend API |
| `VITE_APP_ENV` | `local` \| `dev` \| `test` \| `production` |
| `VITE_WS_URL` | WebSocket endpoint (future) |
| `VITE_ENABLE_MOCKS` | Toggle mock API mode for local development |

Environment files: `.env.local`, `.env.development`, `.env.production`.

---

## 42. Frontend Testing Strategy

**Unit Tests**

- Utility functions, hooks, Zod schemas

**Component Tests**

- UI primitives and feature components (React Testing Library)

**Integration Tests**

- Feature flows with mocked API responses (MSW — Mock Service Worker)

**End-to-End Tests**

- Login, lot/space management, session start-to-payment workflow (Playwright)

---

## 43. Frontend Build & Deployment

```bash
pnpm install
pnpm dev        # local development server
pnpm build      # production build (outputs to dist/)
pnpm preview    # preview production build
pnpm test       # unit + component tests
pnpm test:e2e   # Playwright end-to-end tests
```

The production build is a static bundle served via Nginx (or a CDN), with the backend API reverse-proxied under the same origin to avoid CORS in production.

---

## 44. Frontend Coding Standards

- Strict TypeScript (`strict: true`); no implicit `any`.
- Functional components with Hooks only; no class components.
- One component per file; colocate styles, tests, and types with the component.
- No business logic in `pages/`; pages only compose features.
- No direct API calls inside components — always go through the API layer/hooks.
- Enforce import boundaries: `components/ui` cannot import from `features/`.
- Run ESLint + Prettier on commit (Husky + lint-staged).

---

## 45. Monorepo Project Structure

MetropolisParking is organized as a monorepo containing both the backend service and the frontend application under a shared root, with independent build tooling for each.

```
MetropolisParking/
├── backend/
│   ├── src/
│   │   ├── main/scala/com/metropolisparking/
│   │   │   ├── Main.scala
│   │   │   ├── config/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── repositories/
│   │   │   ├── models/
│   │   │   ├── dto/
│   │   │   ├── validation/
│   │   │   ├── security/
│   │   │   ├── middleware/
│   │   │   ├── exceptions/
│   │   │   └── utils/
│   │   └── resources/
│   ├── test/
│   ├── Dockerfile
│   └── build.sbt
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── pages/
│   │   ├── features/
│   │   ├── components/
│   │   ├── api/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── utils/
│   │   └── main.tsx
│   ├── tests/
│   ├── Dockerfile
│   └── package.json
├── docs/
├── .github/
│   └── workflows/
├── docker-compose.yml
└── README.md
```

---

## 46. Full-Stack Local Development

**Requirements**

- Java 17, SBT (backend)
- Node.js 20+, pnpm (frontend)
- PostgreSQL
- Docker (optional, recommended for full-stack runs)

**Run backend**

```bash
cd backend
sbt run
```

**Run frontend**

```bash
cd frontend
pnpm install
pnpm dev
```

The frontend dev server proxies API requests to the backend (`VITE_API_BASE_URL=http://localhost:8080`), avoiding CORS issues during local development.

---

## 47. Full-Stack Docker Deployment

**Services (`docker-compose.yml`)**

- `backend` — Akka HTTP API
- `frontend` — Nginx serving the built React app, reverse-proxying `/api` to `backend`
- `postgres` — PostgreSQL database
- `flyway` — startup migration runner

**Typical commands**

```bash
docker compose up --build
docker compose down
```

Once running, the frontend is served at `http://localhost` (or the configured port) and transparently proxies API calls to the backend service, so the browser only ever talks to a single origin.

---

## Project Vision

MetropolisParking is designed as a scalable, enterprise-grade parking management platform that demonstrates modern full-stack engineering practices. By combining a layered Scala backend with strong domain modeling, robust testing, and operational observability, alongside a feature-modular React frontend with clean state management and a consistent design system, the project provides a maintainable foundation for evolving into a comprehensive smart parking platform capable of supporting large-scale parking operations — from a single lot to a multi-site, multi-tenant deployment.
