---
name: metropolisparking-architecture
description: Full system architecture, technology stack, container topology, and layer boundaries for the MetropolisParking platform.
---

# MetropolisParking — Architecture Reference

## Stack Overview

| Layer | Technology | Version |
|---|---|---|
| Backend Language | Scala | 2.13.x |
| Backend Runtime | Java | 17 |
| HTTP Framework | Akka HTTP | 10.2.x |
| Reactive Streams | Akka Streams | 2.6.x |
| Database Access | jOOQ | 3.18.x |
| Connection Pool | HikariCP | 5.x |
| Schema Migrations | Flyway | 9.x |
| Authentication | java-jwt + jBCrypt | 4.x / 0.4 |
| Cache | Jedis (Redis) | 5.x |
| Frontend Framework | React | 18 |
| Build Tool | Vite | 5+ |
| Language | TypeScript | 5.x (strict) |
| Styling | Tailwind CSS | v4 |
| Server State | TanStack Query | v5 |
| HTTP Client | Axios | 1.x |
| Form Validation | React Hook Form + Zod | 7.x / 3.x |
| Database | PostgreSQL | 16-alpine |
| Cache Engine | Redis | 7-alpine |
| Reverse Proxy | Nginx | alpine |

## Container Topology (docker-compose.yml)

| Container | Port(s) | Role |
|---|---|---|
| `metropolis-backend` | 8080 (HTTP), 9464 (metrics) | Akka HTTP API server |
| `metropolis-frontend` | 80 | Nginx-proxied React SPA |
| `metropolis-db` | 5432 | PostgreSQL 16 |
| `metropolis-redis` | 6379 | Redis 7 cache |
| `metropolis-prometheus` | 9090 | Metrics collection |
| `metropolis-grafana` | 3000 | Dashboards (admin/admin) |
| `metropolis-loki` | 3100 | Log aggregation |
| `metropolis-promtail` | — | Log shipper sidecar |
| `metropolis-jaeger` | 16686 | Distributed tracing |

## Observability Endpoints

| Service | URL | Notes |
|---|---|---|
| Backend Health | `http://localhost:8080/health` | JSON DB + JVM status |
| OpenTelemetry Metrics | `http://localhost:9464/metrics` | Prometheus scrape target |
| Prometheus | `http://localhost:9090` | Query metrics |
| Grafana | `http://localhost:3000` | Dashboards (admin / admin) |
| Loki | `http://localhost:3100/ready` | Log readiness check |
| Jaeger | `http://localhost:16686` | Trace visualization |

## Architecture Layers (Backend)

```
Routes       → request parsing, validation, response serialization only
Services     → all business logic, computations, orchestration
Repositories → jOOQ database access and transaction boundary control
Models       → clean domain case classes; no framework or jOOQ dependencies
```

## Monorepo Layout

```
/backend    — Scala 2.13 + Akka HTTP server
/frontend   — React 18 + Vite + TypeScript SPA
/           — docker-compose.yml, README.md, scripts/
```

## Flyway Migration Naming

Sequential versioned filenames: `V1__create_users.sql`, `V2__create_roles.sql`, ..., `V13__...sql`

## Default Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@metropolisparking.com` | `admin123` |
| Customer | `customer@metropolisparking.com` | `customer123` |

## Key API Endpoints

| Method | Path | Role | Purpose |
|---|---|---|---|
| POST | `/auth/login` | Public | Issue JWT |
| GET | `/parking-lots` | Authenticated | List lots |
| POST | `/anpr/entry` | ADMIN | ANPR entry scan |
| POST | `/anpr/exit` | ADMIN | ANPR exit scan |
| POST | `/qr/generate` | CUSTOMER | Generate QR pass |
| GET | `/dashboard` | Authenticated | Analytics |
| GET | `/health` | Public | System health |
| WS | `/ws/occupancy` | — | Real-time space feed |
