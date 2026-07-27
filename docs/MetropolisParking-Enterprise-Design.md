# MetropolisParking — Enterprise Architecture & Design Document

This document provides a comprehensive, production-grade engineering design specification for the **MetropolisParking** system. It details the system architecture using the C4 model, database schema entity-relationships, service dependencies, core lifecycle sequences, deployment strategies, and cross-cutting operational concerns.

---

## 1. C4 Architecture Model

The system architecture is modeled hierarchically to separate high-level system context from low-level component execution and code patterns.

### Level 1: System Context Diagram
The System Context Diagram defines the boundaries of MetropolisParking, the external actors interacting with it, and integration touchpoints.

```mermaid
flowchart TB
    classDef actor fill:#003c71,stroke:#002447,stroke-width:2px,color:#fff;
    classDef system fill:#007acc,stroke:#005c99,stroke-width:2px,color:#fff;
    classDef external fill:#7f8c8d,stroke:#6c7a89,stroke-width:2px,color:#fff;

    Customer((Customer)):::actor
    Manager((Facility Manager)):::actor
    ANPRCam((ANPR Camera Gate)):::actor

    Metropolis["MetropolisParking System\n(Full-Stack Management Platform)"]:::system
    PaymentGateway["External Payment Gateway\n(Stripe/UPI Broker)"]:::external

    Customer -->|Reserves spots, views sessions, pays| Metropolis
    Manager -->|Manages topologies, pricing, analytics| Metropolis
    ANPRCam -->|Triggers automated check-in/out| Metropolis
    Metropolis -->|Initiates payment settlements| PaymentGateway
```

### Level 2: Container Diagram
The Container Diagram illustrates the high-level technical choices, data storage systems, proxy routing layers, and how data flows between them.

```mermaid
flowchart TD
    classDef client fill:#34495e,stroke:#2c3e50,stroke-width:2px,color:#fff;
    classDef container fill:#2980b9,stroke:#2471a3,stroke-width:2px,color:#fff;
    classDef storage fill:#27ae60,stroke:#2196f3,stroke-width:2px,color:#fff;

    subgraph ClientLayer ["Client Interfaces"]
        Browser["React Single Page Application\n(React 19 + TypeScript + Vite)"]:::client
        CamAgent["ANPR Camera Agent\n(HTTP Client)"]:::client
    end

    subgraph ProxyLayer ["Proxy & Routing"]
        Nginx["Nginx Reverse Proxy\n(HTTP Port :80)"]:::container
    end

    subgraph AppLayer ["Backend Runtime Container"]
        ScalaApp["Scala Backend API\n(Akka HTTP Server + Akka Streams)"]:::container
    end

    subgraph StorageLayer ["Persistence & Caching"]
        Postgres["PostgreSQL Database\n(16-Alpine, Relational)"]:::storage
        Redis["Redis Cache\n(7-Alpine, Key-Value)"]:::storage
    end

    Browser -->|HTTP REST & WebSockets| Nginx
    CamAgent -->|HTTP REST| Nginx
    Nginx -->|Proxy REST/WS to :8080| ScalaApp
    ScalaApp -->|HikariCP / JDBC| Postgres
    ScalaApp -->|Jedis Connection Pool| Redis
```

### Level 3: Component Diagram (Scala Backend)
This diagram zooms into the Scala Backend container to show the internal logic layers, dependency directions, and boundaries.

```mermaid
flowchart TD
    classDef route fill:#9b59b6,stroke:#8e44ad,stroke-width:2px,color:#fff;
    classDef svc fill:#e67e22,stroke:#d35400,stroke-width:2px,color:#fff;
    classDef repo fill:#1abc9c,stroke:#16a085,stroke-width:2px,color:#fff;
    classDef infra fill:#7f8c8d,stroke:#5f6c7d,stroke-width:2px,color:#fff;

    subgraph RoutesGroup ["API Route Handlers"]
        AuthRoutes["AuthRoutes"]:::route
        SessionRoutes["ParkingSessionRoutes"]:::route
        SpaceRoutes["ParkingSpaceRoutes"]:::route
        ResRoutes["ReservationRoutes"]:::route
        WSRoutes["WebSocketRoutes"]:::route
    end

    subgraph MiddlewareGroup ["Interceptors & Filters"]
        Rbac["RBAC & JWT Middleware"]:::infra
        Logging["Logging & Correlation ID"]:::infra
    end

    subgraph ServicesGroup ["Business Logic Engine"]
        AuthSvc["AuthService"]:::svc
        SessionSvc["ParkingSessionService"]:::svc
        SpaceSvc["ParkingSpaceService"]:::svc
        ResSvc["ReservationService"]:::svc
        PricingSvc["PricingService"]:::svc
        WSSvc["WebSocketService"]:::svc
        RedisSvc["RedisService"]:::svc
    end

    subgraph ReposGroup ["Data Access Layer (jOOQ)"]
        UserRepo["UserRepository"]:::repo
        SessionRepo["ParkingSessionRepository"]:::repo
        SpaceRepo["ParkingSpaceRepository"]:::repo
        ResRepo["ReservationRepository"]:::repo
        VehicleRepo["VehicleRepository"]:::repo
        PaymentRepo["PaymentRepository"]:::repo
    end

    %% Client request routing
    Rbac --> RoutesGroup
    Logging --> Rbac

    %% Route to Service mappings
    AuthRoutes --> AuthSvc
    SessionRoutes --> SessionSvc
    SpaceRoutes --> SpaceSvc
    ResRoutes --> ResSvc
    WSRoutes --> WSSvc

    %% Service business calculations
    SessionSvc --> PricingSvc
    SessionSvc --> WSSvc
    ResSvc --> SpaceSvc

    %% Service to Repository mappings
    AuthSvc --> UserRepo
    SessionSvc --> SessionRepo
    SessionSvc --> VehicleRepo
    SessionSvc --> SpaceRepo
    SessionSvc --> PaymentRepo
    SpaceSvc --> SpaceRepo
    ResSvc --> ResRepo
    ResSvc --> SpaceRepo

    %% Cache utility
    SessionSvc --> RedisSvc
    ResSvc --> RedisSvc
```

### Level 4: Code Diagram (Detailed Start Session Flow)
This diagram illustrates the code execution structure of the **Session Entry/Check-in** workflow.

```mermaid
classDiagram
    direction LR
    class ParkingSessionRoutes {
        +startSessionRoute: Route
        +authenticateUser(): UserClaims
    }
    class ParkingSessionService {
        +startSession(dto: StartSessionDto): Future[Session]
    }
    class VehicleRepository {
        +findOrCreate(plate: String, t: VehicleType): Future[Vehicle]
    }
    class ParkingSpaceRepository {
        +findAvailableSpace(lotId: UUID, vt: VehicleType): Future[Option[Space]]
        +updateStatus(id: UUID, s: SpaceStatus): Future[Unit]
    }
    class ParkingSessionRepository {
        +createSession(session: ParkingSession): Future[ParkingSession]
        +findActiveSessionByVehicle(vId: UUID): Future[Option[ParkingSession]]
    }
    class WebSocketService {
        +broadcastSpaceMutation(event: SpaceMutationEvent): Unit
    }

    ParkingSessionRoutes --> ParkingSessionService : invokes
    ParkingSessionService --> VehicleRepository : resolve vehicle
    ParkingSessionService --> ParkingSpaceRepository : query & lock spot
    ParkingSessionService --> ParkingSessionRepository : persist session
    ParkingSessionService --> WebSocketService : notify mutations
```

---

## 2. Database Entity-Relationship Diagram (ERD)

The PostgreSQL database schema consists of 11 core tables designed for integrity, speed, and strict referential constraints.

```mermaid
erDiagram
    users {
        UUID id PK
        VARCHAR name
        VARCHAR email UK
        VARCHAR password_hash
        UUID role_id FK
        TIMESTAMP WITH_TIME_ZONE created_at
        TIMESTAMP WITH_TIME_ZONE updated_at
        TIMESTAMP WITH_TIME_ZONE deleted_at
    }
    roles {
        UUID id PK
        VARCHAR name UK
        VARCHAR description
    }
    permissions {
        UUID id PK
        VARCHAR name UK
        VARCHAR description
    }
    role_permissions {
        UUID role_id PK, FK
        UUID permission_id PK, FK
    }
    vehicles {
        UUID id PK
        VARCHAR plate_number UK
        VARCHAR type
        UUID owner_id FK
        TIMESTAMP WITH_TIME_ZONE created_at
        TIMESTAMP WITH_TIME_ZONE updated_at
        TIMESTAMP WITH_TIME_ZONE deleted_at
    }
    parking_lots {
        UUID id PK
        VARCHAR name
        VARCHAR location
        TIMESTAMP WITH_TIME_ZONE created_at
        TIMESTAMP WITH_TIME_ZONE updated_at
        TIMESTAMP WITH_TIME_ZONE deleted_at
    }
    parking_levels {
        UUID id PK
        UUID lot_id FK
        INT level_number
        TIMESTAMP WITH_TIME_ZONE created_at
        TIMESTAMP WITH_TIME_ZONE updated_at
    }
    parking_spaces {
        UUID id PK
        UUID lot_id FK
        UUID level_id FK
        VARCHAR space_number
        VARCHAR type
        VARCHAR status
        TIMESTAMP WITH_TIME_ZONE created_at
        TIMESTAMP WITH_TIME_ZONE updated_at
        TIMESTAMP WITH_TIME_ZONE deleted_at
    }
    reservations {
        UUID id PK
        UUID user_id FK
        UUID space_id FK
        TIMESTAMP WITH_TIME_ZONE start_time
        TIMESTAMP WITH_TIME_ZONE end_time
        VARCHAR status
        NUMERIC fee
        TIMESTAMP WITH_TIME_ZONE created_at
        TIMESTAMP WITH_TIME_ZONE updated_at
    }
    parking_sessions {
        UUID id PK
        UUID vehicle_id FK
        UUID space_id FK
        TIMESTAMP WITH_TIME_ZONE entry_time
        TIMESTAMP WITH_TIME_ZONE exit_time
        INT duration_minutes
        DECIMAL fee
        TIMESTAMP WITH_TIME_ZONE created_at
        TIMESTAMP WITH_TIME_ZONE updated_at
    }
    pricing_rules {
        UUID id PK
        VARCHAR rule_type
        DECIMAL rate
        VARCHAR vehicle_type
        UUID lot_id FK
        TIMESTAMP WITH_TIME_ZONE created_at
        TIMESTAMP WITH_TIME_ZONE updated_at
    }
    payments {
        UUID id PK
        UUID session_id FK
        DECIMAL amount
        VARCHAR method
        VARCHAR status
        TIMESTAMP WITH_TIME_ZONE created_at
        TIMESTAMP WITH_TIME_ZONE updated_at
    }
    audit_logs {
        UUID id PK
        UUID user_id FK
        VARCHAR action
        VARCHAR entity_type
        UUID entity_id
        TEXT details
        TIMESTAMP WITH_TIME_ZONE timestamp
    }

    users ||--o| roles : has
    roles ||--o{ role_permissions : defines
    permissions ||--o{ role_permissions : grants
    users ||--o{ vehicles : owns
    parking_lots ||--o{ parking_levels : has
    parking_levels ||--o{ parking_spaces : contains
    parking_lots ||--o{ parking_spaces : indexes
    parking_spaces ||--o{ reservations : books
    users ||--o{ reservations : creates
    vehicles ||--o{ parking_sessions : logs
    parking_spaces ||--o{ parking_sessions : hosts
    parking_sessions ||--o| payments : settles
    parking_lots ||--o{ pricing_rules : applies
    users ||--o{ audit_logs : logs_action
```

---

## 3. Service Dependency Diagrams

This diagram details system dependencies from the API ingress through the backend modules, database, and background processes.

```mermaid
flowchart LR
    Ingress[HTTP/WS Ingress] --> Routes[Akka HTTP Routes]
    Routes --> Middleware[Rbac/Auth/Logging Middleware]
    Middleware --> Services[Business Services Layer]
    Services --> DBRepo[jOOQ SQL Repositories]
    Services --> Cache[Redis Jedis Service]
    Services --> WS[WebSocket Broadcast Sink]
    DBRepo --> Hikari[HikariCP JDBC Pool]
    Hikari --> Postgres[(PostgreSQL DB)]
    
    subgraph AsyncTasks ["Background Worker Module"]
        Scheduler[Akka Scheduler] --> DBRepo
        Scheduler --> WS
        Scheduler --> Cache
    end
```

---

## 4. Authentication Sequence Diagram

Standard stateless login and subsequent authenticated request workflow using JWT tokens.

```mermaid
sequenceDiagram
    autonumber
    actor Customer as User / Client
    participant Frontend as SPA (React)
    participant Nginx as Nginx Proxy
    participant Backend as Scala Auth Service
    participant DB as PostgreSQL

    Customer->>Frontend: Fill credentials & click Login
    Frontend->>Nginx: POST /api/auth/login
    Nginx->>Backend: Forward POST /auth/login
    Backend->>DB: Fetch User by Email
    DB-->>Backend: User Details + Bcrypt Hash
    Backend->>Backend: Match passwords via BCrypt.checkpw()
    alt Credentials Valid
        Backend->>Backend: Generate JWT Token (Sub: UserID, Claim: Role)
        Backend-->>Nginx: Return JWT Token (200 OK)
        Nginx-->>Frontend: Return JWT Token
        Frontend->>Frontend: Save JWT in Context/LocalStorage
        Frontend-->>Customer: Display Dashboard Home
    else Credentials Invalid
        Backend-->>Nginx: Return 401 Unauthorized
        Nginx-->>Frontend: Return 401
        Frontend-->>Customer: Show "Invalid Credentials" Error
    end

    Note over Customer, DB: Subsequent API Request Flow
    Customer->>Frontend: Click "Reserve Spot"
    Frontend->>Nginx: GET /api/parking-spaces (Header: Authorization: Bearer JWT)
    Nginx->>Backend: Forward GET /parking-spaces (with Token)
    Backend->>Backend: Extract & verify JWT token payload
    Backend->>DB: Query parking spaces with filtered parameters
    DB-->>Backend: Raw rows
    Backend-->>Nginx: Return 200 OK (JSON array)
    Nginx-->>Frontend: Return Data
    Frontend-->>Customer: Render Parking Grid
```

---

## 5. Parking Session Lifecycle Sequence

The primary checkout workflow: from entry detection (ANPR/manual) through real-time spot occupancy to departure and payment settlement.

```mermaid
sequenceDiagram
    autonumber
    actor Driver as Driver / Vehicle
    participant Camera as ANPR Camera Scanner
    participant Backend as Scala Service Engine
    participant DB as PostgreSQL
    participant Redis as Redis Cache
    participant WS as WebSocket Hub
    participant Clients as Connected Frontends

    Driver->>Camera: Drive up to entrance gate
    Camera->>Backend: Scan License Plate (POST /anpr/entry)
    Backend->>DB: Find active session for plate
    Note over Backend, DB: Ensure vehicle is not double-entering
    Backend->>DB: Locate and lock closest available Space (AVAILABLE)
    DB-->>Backend: Space Allocated (e.g. A-102)
    Backend->>DB: Insert parking_sessions record (status: ACTIVE)
    Backend->>DB: Update parking_spaces status to 'OCCUPIED'
    Backend->>Redis: Invalidate "dashboard:stats" cache key
    Backend->>WS: Push SPACE_STATUS_MUTATED event
    WS-->>Clients: Update parking grid UI in real-time (A-102: RED)
    Backend-->>Camera: Gate command [ OPEN GATE ]
    Driver->>Driver: Park vehicle at Space A-102

    Note over Driver, Clients: Time Passes (Parking Duration)

    Driver->>Camera: Drive up to exit gate
    Camera->>Backend: Scan License Plate (POST /anpr/exit)
    Backend->>DB: Fetch active session record
    DB-->>Backend: Active Session Details
    Backend->>Backend: Calculate duration & apply pricing rules
    Backend->>DB: Update parking_sessions exit_time, duration, fee
    Backend-->>Camera: Return fee details & request payment settlement
    Driver->>Camera: Settle Fee (POST /payments/:id/process)
    Camera->>Backend: Settle payment invoice
    Backend->>DB: Insert Payment record (status: SUCCESS)
    Backend->>DB: Set parking_spaces status to 'AVAILABLE'
    Backend->>Redis: Invalidate "dashboard:stats" cache key
    Backend->>WS: Push SPACE_STATUS_MUTATED event
    WS-->>Clients: Update parking grid UI in real-time (A-102: GREEN)
    Backend-->>Camera: Gate command [ OPEN GATE - PASS ]
```

---

## 6. Reservation Lifecycle Sequence

The spot advance reservation engine prevents booking conflicts and transitions booking slots automatically.

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Registered Customer
    participant UI as React UI
    participant Backend as Scala Service Engine
    participant DB as PostgreSQL
    participant Scheduler as Background Cron Scheduler

    Customer->>UI: Select Spot, Start & End Time
    UI->>Backend: POST /reservations
    Backend->>DB: Query reservations overlapping timeslot
    DB-->>Backend: Intersecting records (if any)
    alt Conflict Exists
        Backend-->>UI: 400 Bad Request (Conflict)
        UI-->>Customer: Show "Time slot already booked"
    else No Conflict
        Backend->>DB: Insert reservation (status: CONFIRMED)
        Backend-->>UI: 201 Created (QR Code token Payload)
        UI-->>Customer: Render PDF / QR Gate Pass
    end

    Note over Scheduler, DB: Expired Reservation Daemon (Every 1 minute)
    Scheduler->>DB: Fetch PENDING/CONFIRMED reservations past start_time + grace_period
    DB-->>Scheduler: Stale reservation IDs
    Scheduler->>DB: Batch update reservations set status = 'CANCELLED'
    Scheduler->>DB: Revert space statuses to 'AVAILABLE'
```

---

## 7. Payment Processing Workflow

Ensuring transactional safety and audit-logged transparency for financial calculations.

```mermaid
flowchart TD
    Start([Session Ended / Exit Event]) --> Calc[Fetch Pricing Rules & Calculate Fee]
    Calc --> InsertPayment[Create payment invoice record in status: PENDING]
    InsertPayment --> UI[Expose Invoice to Client Interface]
    UI --> Method{Choose Payment Method}
    
    Method -->|Card/UPI/Wallet| ExternalGateway[Process External Gateway Transaction]
    ExternalGateway --> GateStatus{Gateway Response}
    GateStatus -->|Success| Complete[Update payments status to SUCCESS]
    GateStatus -->|Failure| Fail[Update payments status to FAILED]
    
    Method -->|Cash Handover| CashGate[Cashier marks invoice as paid]
    CashGate --> Complete
    
    Complete --> CompleteSession[Mark parking session status as COMPLETED]
    CompleteSession --> ReleaseSpot[Update parking_spaces.status = AVAILABLE]
    ReleaseSpot --> WriteAudit[Log Audited Action: Session Settlement]
    WriteAudit --> End([Gate Opens / Flow Completed])
    
    Fail --> Retry[Display retry settlement screen on UI]
    Retry --> UI
```

---

## 8. Deployment Architecture

Containerized infrastructure using a Docker Compose layered layout, ready for orchestration platforms.

```mermaid
flowchart TB
    Internet([Web Clients & Camera Feeds]) -->|HTTPS Port :443| Proxy[Nginx Host Container]
    Proxy -->|Local Static Routing| Build[Static SPA Assets File Server]
    Proxy -->|Reverse Proxy /api| AppNode1[Scala Backend API Node 1]
    Proxy -->|Reverse Proxy /api| AppNode2[Scala Backend API Node 2]
    
    subgraph ContainerNetwork ["Docker Private Network Bridge"]
        AppNode1
        AppNode2
        DB[(PostgreSQL Primary)]
        Replica[(PostgreSQL Read-Replica)]
        RedisCache[(Redis Cache Server)]
    end

    AppNode1 -->|Write/Read| DB
    AppNode2 -->|Write/Read| DB
    AppNode1 -->|Read-Only Queries| Replica
    AppNode2 -->|Read-Only Queries| Replica
    AppNode1 -->|Get/Set/Invalidate| RedisCache
    AppNode2 -->|Get/Set/Invalidate| RedisCache
```

---

## 9. Observability and Monitoring Architecture

Production reliability is maintained using a multi-tiered logging and diagnostic dashboard approach.

- **Correlation Tracing (MDC)**:
  Every incoming API request is stamped with a unique `X-Correlation-ID` header. This identifier is propagated down through the Akka HTTP middleware, services, and repository layers, and injected into the Logback logging context (MDC) so that all logs matching a single client request can be aggregated instantaneously.
- **System Health Diagnostics**:
  Exposes the `/health` endpoint containing:
  - **Database Connection Pool Status**: Max active connections, currently borrowed connections, pending threads.
  - **Redis Cache Status**: Active pings (`PONG`).
  - **System Resources**: JVM memory heap usage, CPU load, and server uptime.
- **Metric Ingestion Engine**:
  - **Prometheus Scraper**: Exposes Prometheus-compatible endpoints collecting JVM stats, Hikari connection latency, and HTTP request counters.
  - **Grafana Visualization**: Enterprise panels visualizing response times (P99, P95), active sessions, database query timings, and system logs.

---

## 10. Performance Considerations

To sustain sub-second responses even at maximum load, the system implements:

### Database Indexing Strategy
- **Unique Indices**: Explicit unique constraints on `users.email` and `vehicles.plate_number`.
- **Search Indices**: Composite query index on `reservations(space_id, start_time, end_time)` to expedite overlap/conflict validation searches.
- **Foreign Key Indexing**: Explicit indices on foreign keys: `parking_spaces.lot_id`, `parking_spaces.level_id`, `parking_sessions.space_id`, and `parking_sessions.vehicle_id`.

### In-Memory Caching (Redis)
- **Aggregation Cache**: Dashboard metrics (`dashboard:stats`) are aggregated and cached with a Time-To-Live (TTL) of 300 seconds.
- **Cache Eviction**: Every session write (`startSession`, `endSession`), space mutation, or reservation booking triggers an immediate synchronous invalidate (`del`) call to the Redis key, ensuring data freshness.

### Connection Pooling (HikariCP)
- **Configuration**:
  - `maximumPoolSize`: 16 (per backend node).
  - `minimumIdle`: 8.
  - `idleTimeout`: 30000 ms.
  - `connectionTimeout`: 5000 ms.

---

## 11. Security Model

Security is baked directly into the API gateways and application boundary controls.

- **Cryptography & Hashing**:
  - Passwords are never stored in plaintext. They are salted and hashed utilizing the **BCrypt** algorithm (Work Factor: 12).
- **Stateless Authorization Token (JWT)**:
  - Access tokens are signed using the **HMAC-SHA256** signature scheme.
  - Token validation is processed entirely stateless in memory via the `RbacMiddleware` directive, minimizing database load.
- **Granular Access Policies (RBAC)**:
  - Roles (`ADMIN`, `CUSTOMER`) map to specific fine-grained permissions.
  - Endpoints utilize the Scala route directives to apply role checks:
    ```scala
    authorizeRoles(Set("ADMIN")) { claims =>
       // Admin actions only
    }
    ```
- **Immutable Transactions & Audit Logging**:
  - Critical database writes and permission changes populate the `audit_logs` table via transaction triggers or explicit repository calls.
  - The `audit_logs` schema has no update/delete access points to preserve historical traceability.

---

## 12. Scalability Strategy

The platform is designed to scale out horizontally as demand grows:

1. **Stateless Backend Nodes**:
   - The backend contains no sticky server sessions. All client state resides in the JWT token or the underlying database.
2. **WebSocket Fan-out & Akka Stream Source**:
   - Live occupancy data is pushed down through an Akka Streams Source using `Source.queue` and broadcasted via `MergeHub.source`. This maintains connection multiplexing at low memory overhead.
3. **Redis Pub/Sub Synchronization**:
   - When running multiple horizontal backend containers behind Nginx, a spot change on Node 1 is published via a Redis channel. Node 2 and Node 3 subscribe to this channel and broadcast the mutation to their locally connected WebSocket browser clients.
4. **Database Separation**:
   - Read-heavy requests (such as displaying active maps or generating reports) route to the PostgreSQL Read-Replica, leaving the Primary Database fully available for write-intensive ticket check-in and checkout flows.
