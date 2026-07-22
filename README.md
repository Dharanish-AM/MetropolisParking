# MetropolisParking

A full-stack smart parking management system built with **Scala + Akka HTTP** on the backend and **React 18 + Vite + TypeScript** on the frontend.

---

## Table of Contents

- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start (Docker)](#quick-start-docker)
- [Local Development](#local-development)
- [Running Tests](#running-tests)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)

---

## Architecture

```
metropolis-parking/
├── backend/          # Scala 2.13 + Akka HTTP + jOOQ + Flyway
├── frontend/         # React 18 + Vite + TypeScript + Tailwind CSS v4
├── docker-compose.yml
└── .github/workflows/ci.yml
```

**Stack:**

| Layer | Technology |
|---|---|
| Backend | Scala 2.13, Akka HTTP, jOOQ, HikariCP, Flyway, JWT, BCrypt |
| Frontend | React 18, Vite, TypeScript, Tailwind CSS v4, TanStack Query, Axios, Zod |
| Database | PostgreSQL 16 |
| Container | Docker + Nginx (frontend reverse proxy) |
| CI | GitHub Actions |

---

## Prerequisites

| Tool | Version |
|---|---|
| Docker & Docker Compose | 24+ |
| Java (for local backend dev) | 17 |
| sbt (for local backend dev) | 1.9+ |
| Node.js (for local frontend dev) | 20+ |

---

## Quick Start (Docker)

> Spins up the database, backend, and frontend in one command.

**1. Clone the repository:**

```bash
git clone https://github.com/Dharanish-AM/MetropolisParking.git
cd MetropolisParking
```

**2. Build and start all services:**

```bash
docker compose up --build
```

**3. Access the application:**

| Service | URL |
|---|---|
| Frontend (UI) | http://localhost |
| Backend API | http://localhost:8080 |
| Health Check | http://localhost:8080/health |

**Default admin credentials:**

| Field | Value |
|---|---|
| Email | admin@metropolisparking.com |
| Password | admin123 |

---

## Local Development

### Backend

```bash
# Start the database container only
docker compose up -d db

# Run the Akka HTTP backend (auto-runs Flyway migrations on startup)
cd backend
sbt run
```

Backend binds to `http://localhost:8080`.

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the Vite dev server
npm run dev
```

Frontend binds to `http://localhost:5174`.

> The Axios client in `src/api/client.ts` points to `http://localhost:8080` by default.

---

## Running Tests

### Frontend E2E Tests (Playwright)

> Requires the full stack to be running (backend on `8080`, frontend dev server on `5174`).

```bash
cd frontend

# Install Playwright browsers (first time only)
npx playwright install chromium

# Run all E2E tests headlessly
npm run test:e2e

# Open the interactive Playwright UI
npm run test:e2e:ui
```

E2E test specs are located in `frontend/e2e/`:
- `auth.spec.ts` — Login, redirect, and error flows
- `session.spec.ts` — Session management UI flows
- `payment.spec.ts` — Payment ledger and settle modal flows

### Backend Tests

```bash
# Start the database container
docker compose up -d db

cd backend

# Run unit tests
sbt test

# Run integration tests
sbt "testOnly *Integration*"
```

### Full E2E Shell Script

```bash
# From repo root, requires backend on :8080
./scripts/e2e-test.sh
```

---

## Environment Variables

### Backend (`backend/.env.example`)

| Variable | Description | Default |
|---|---|---|
| `DB_URL` | JDBC connection URL | `jdbc:postgresql://localhost:5432/metropolis_parking` |
| `DB_USERNAME` | Database username | `postgres` |
| `DB_PASSWORD` | Database password | `password` |
| `JWT_SECRET` | JWT signing secret | `change-in-production` |

### Frontend

The Axios base URL is configured in `src/api/client.ts`. Override via a `.env.local` file:

```
VITE_API_BASE_URL=http://localhost:8080
```

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | Authenticate user, returns JWT |
| GET | `/me` | Get current user profile |
| GET | `/parking-lots` | List all parking lots |
| POST | `/parking-lots` | Create a parking lot |
| GET | `/parking-lots/:id/levels` | List levels in a lot |
| GET | `/parking-spaces` | List parking spaces |
| PATCH | `/parking-spaces/:id/status` | Update space status |
| GET | `/vehicles` | List/search vehicles |
| POST | `/vehicles` | Register a vehicle |
| POST | `/sessions/start` | Start a parking session |
| POST | `/sessions/:plate/end` | End a parking session |
| GET | `/payments` | List all payments |
| POST | `/payments/:id/process` | Process a payment |
| GET | `/dashboard` | Aggregated dashboard stats |
| GET | `/health` | Backend health check |
