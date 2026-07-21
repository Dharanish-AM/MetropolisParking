# MetropolisParking

Enterprise Parking Management Platform.

## Requirements

- Java 17
- SBT
- Node.js 20+
- pnpm
- Docker

## Getting Started

### Local Development

1. Run the database via Docker Compose:
   ```bash
   docker compose up -d postgres
   ```

2. Run the backend:
   ```bash
   cd backend
   sbt run
   ```

3. Run the frontend:
   ```bash
   cd frontend
   pnpm install
   pnpm dev
   ```

### Docker Deployment

To build and launch the entire stack:
```bash
docker compose up --build
```
