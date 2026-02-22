# Shift Planner API

Production-quality **employee shift planning REST API** built with NestJS, Prisma 6, and PostgreSQL.  
Portfolio project — demonstrating clean architecture, JWT auth, role-based access, and audit logging.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS 11 |
| ORM | Prisma 6 + PostgreSQL 16 |
| Auth | JWT (access 15 min) + Refresh Token (7 days, httpOnly cookie) |
| Validation | class-validator / class-transformer |
| Logging | pino / nestjs-pino |
| Rate Limiting | @nestjs/throttler |
| Date/Time | date-fns + date-fns-tz (DB = UTC, UI = Europe/Istanbul) |
| Testing | Jest (unit) + Supertest (e2e) |

---

## Getting Started

### Prerequisites

- Node.js 20+
- Docker Desktop (for PostgreSQL)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/shift-planner-api.git
cd shift-planner-api
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env
```

Default `.env` works out of the box with the Docker Compose setup below.

### 3. Start PostgreSQL

```bash
docker compose up -d
```

This starts a PostgreSQL 16 container on port `5432`.

### 4. Run Migrations

```bash
npx prisma migrate dev --name init
```

### 5. Seed Demo Data

```bash
npm run seed
```

### 6. Start the Dev Server

```bash
npm run start:dev
```

API is available at **http://localhost:3001/api**

---

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@shiftplanner.com | Admin1234! |
| Manager | manager@shiftplanner.com | Manager1234! |
| Employee | ali@shiftplanner.com | Employee1234! |
| Employee | zeynep@shiftplanner.com | Employee1234! |
| Employee | mehmet@shiftplanner.com | Employee1234! |
| Employee | elif@shiftplanner.com | Employee1234! |
| Employee | can@shiftplanner.com | Employee1234! |

---

## API Endpoints

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login (returns access token + sets refresh cookie) |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout (clears refresh cookie) |
| GET | `/api/auth/me` | Current user info |

### Employees
| Method | Path | Access |
|---|---|---|
| GET | `/api/employees` | MANAGER+ |
| GET | `/api/employees/:id` | MANAGER+ |
| POST | `/api/employees` | ADMIN / MANAGER |
| PATCH | `/api/employees/:id` | ADMIN / MANAGER |
| DELETE | `/api/employees/:id` | ADMIN / MANAGER |

### Shifts
| Method | Path | Description |
|---|---|---|
| GET | `/api/shifts` | List shifts (filterable by employeeId, week, status) |
| POST | `/api/shifts` | Create shift (MANAGER+) |
| PATCH | `/api/shifts/:id` | Update shift (MANAGER+) |
| DELETE | `/api/shifts/:id` | Delete shift (MANAGER+) |
| POST | `/api/shifts/:id/acknowledge` | Employee acknowledges shift |
| PATCH | `/api/shifts/:id/publish` | Publish draft shift (MANAGER+) |
| POST | `/api/shifts/copy-week` | Copy one week's shifts to another (MANAGER+) |

### Schedule
| Method | Path | Description |
|---|---|---|
| GET | `/api/schedule/week?start=YYYY-MM-DD` | Weekly schedule grid |

### Availability
| Method | Path | Description |
|---|---|---|
| GET | `/api/availability` | List availability blocks |
| POST | `/api/availability` | Create availability block |
| DELETE | `/api/availability/:id` | Delete availability block |

### Reports
| Method | Path | Description |
|---|---|---|
| GET | `/api/reports/weekly-hours?weekStart=YYYY-MM-DD` | Weekly hours report |

### Health
| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |

---

## Database Schema

Key models:

- **User** — authentication (email, name, passwordHash, role)
- **Employee** — HR profile linked to User (position, department, hourlyRate, maxWeeklyHours)
- **Shift** — time-based shift (startTime, endTime, status: DRAFT/PUBLISHED/ACKNOWLEDGED/CANCELLED)
- **AvailabilityBlock** — recurring or one-off unavailability (type: UNAVAILABLE/PREFER_NOT/AVAILABLE_ONLY, dayOfWeek, time ranges)
- **AuditLog** — change history for all entities

---

## Project Structure

```
src/
├── auth/           # JWT auth, refresh token, guards, strategies
├── employees/      # Employee CRUD
├── shifts/         # Shift management + validation
├── availability/   # Employee availability blocks
├── schedule/       # Weekly grid + auto-assignment
├── reports/        # Hours & cost reporting
├── audit/          # Audit log service
├── health/         # Health check endpoint
└── prisma/         # PrismaService
prisma/
├── schema.prisma   # Database schema
├── migrations/     # SQL migrations (auto-generated)
└── seed.ts         # Demo data seeder
```

---

## Deployment (Railway + Neon)

1. Create a Neon PostgreSQL database → copy `DATABASE_URL`
2. Deploy this repo to Railway
3. Set environment variables in Railway dashboard
4. Railway automatically runs `npm run build && npm run start:prod`

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | HTTP port | `3001` |
| `DATABASE_URL` | PostgreSQL connection string | (required) |
| `JWT_SECRET` | Access token signing key | (required) |
| `JWT_REFRESH_SECRET` | Refresh token signing key | (required) |
| `JWT_ACCESS_EXPIRATION` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRATION` | Refresh token TTL | `7d` |
| `FRONTEND_URL` | CORS allowed origin | `http://localhost:3000` |
| `NODE_ENV` | Environment | `development` |
| `TZ` | Process timezone | `UTC` |

---

## Running Tests

```bash
# Unit tests
npm run test

# e2e tests (requires running database)
npm run test:e2e

# Coverage
npm run test:cov
```
