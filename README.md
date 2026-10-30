# LankaLink

Remote family & property care platform for the Sri Lankan diaspora. Customers living overseas (or away from home) can book, monitor and pay verified local service providers for property inspections, cleaning, garden care, repairs, pet care, non-medical family welfare visits and errands — with GPS check-ins, photo/video proof and digital service reports.

## Tech stack

MERN — MongoDB, Express, React, Node.js.

## Project structure

```
LankaLink/
├── frontend/   # React web app (customer, provider and admin interfaces)
└── backend/    # Node.js + Express REST API with MongoDB
```

## Team

| Member | Modules |
|---|---|
| Dilshan K.A | Customer registration/login, customer & property/family profiles, service search, customer dashboard |
| De Silva G.A.E | Provider registration & profiles, document upload, admin verification, ratings/reviews, provider management |
| Salpitikorala S.K.S.R | Booking, scheduling, recurring bookings, provider assignment, booking status & tracking |
| A J A Ahmed | Payments, GPS check-in/out, photo/video evidence, notifications, service reports, analytics |

## Getting started

### Option 1 — Docker (recommended)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/) (running).

```bash
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000/api/health |
| MongoDB | mongodb://localhost:27017/lankalink |

Code changes in `frontend/` and `backend/` reload automatically. After adding or removing an npm package, rebuild with `docker compose up --build -V`.

### Option 2 — Run locally with Node

Requires Node.js 22+. Start just the database with Docker (or use a local/Atlas MongoDB):

```bash
docker compose up -d mongo
```

Then in two terminals:

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

```bash
cd frontend
npm install
npm run dev
```

> Tip: even when using Docker, run `npm install` locally in each folder so VS Code gets autocomplete and linting.

## Branches

- `main` — stable, submission-ready code
- `develop` — integration branch; create feature branches from here and merge back via pull request
