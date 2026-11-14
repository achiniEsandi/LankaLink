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

### Database: MongoDB Atlas

All data, including uploaded photos and documents (stored in MongoDB GridFS), lives in the shared **MongoDB Atlas** cluster. There is no local database. Before running anything:

1. Ask the team lead for your own Atlas database user, and make sure your IP address is allowed under Atlas **Network Access**.
2. Create `backend/.env` from the example and fill in `MONGO_URI` and `JWT_SECRET`:
   ```bash
   cp backend/.env.example backend/.env
   ```

`backend/.env` is ignored by Git. Never commit it or paste the connection string in chats. The backend refuses to start if `MONGO_URI` or `JWT_SECRET` is missing.

### Option 1 — Docker (recommended)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/) (running). Docker reads `backend/.env`, so the containers use the same Atlas database.

```bash
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000/api/health (should show `"db":"connected"`) |

If port 5000 or 5173 is already used by another project, pick other host ports:

```bash
BACKEND_PORT=5050 FRONTEND_PORT=5174 docker compose up --build
```

(PowerShell: `$env:BACKEND_PORT=5050; $env:FRONTEND_PORT=5174; docker compose up --build`)

Code changes in `frontend/` and `backend/` reload automatically. After adding or removing an npm package, rebuild with `docker compose up --build -V`.

### Option 2 — Run locally with Node

Requires Node.js 22+ and `backend/.env` set up as above. In two terminals:

```bash
cd backend
npm install
npm run dev
```

```bash
cd frontend
npm install
npm run dev
```

> Tip: even when using Docker, run `npm install` locally in each folder so VS Code gets autocomplete and linting.
>
> `npm test` in `backend/` uses a temporary in-memory MongoDB, so tests never touch the Atlas data.

## Photos for the public pages

The landing and professionals pages show real photos once these files are placed in `frontend/public/images/` (JPG, about 1200 px wide, landscape). Until then a coloured placeholder or illustration is shown, so nothing breaks.

| File | What it should show |
|---|---|
| `svc-property_inspection.jpg` | A person checking an empty house (door, roof, walls) |
| `svc-house_cleaning.jpg` | Someone cleaning a living room or kitchen |
| `svc-garden_maintenance.jpg` | A gardener trimming plants or cutting grass |
| `svc-minor_repairs.jpg` | A technician fixing a tap, switch or door |
| `svc-pet_care.jpg` | Someone feeding or walking a dog |
| `svc-family_welfare_visit.jpg` | A carer chatting with an elderly person at home |
| `svc-errand_assistance.jpg` | Someone carrying groceries or paying a bill |
| `pro-hero.jpg` | A friendly service professional with their tools |

Use photos you own or free-licence ones (for example from [Unsplash](https://unsplash.com/license) or [Pexels](https://www.pexels.com/license/)), ideally of Sri Lankan homes and people. The hero collage switches from the illustration to photos once `svc-house_cleaning.jpg` exists.

## Email verification

New providers get an email with a confirmation link (valid 24 hours). Admins cannot approve a provider until their email is confirmed.

- **Development:** leave `BREVO_API_KEY` empty. The email, including the link, is printed in the backend terminal. Open the link in the browser to confirm.
- **Real emails:** create a free [Brevo](https://www.brevo.com/) account, verify the sender address you want to send from, create an API key, and set `BREVO_API_KEY` and `EMAIL_FROM` in `backend/.env`. Restart the backend.

Logins are limited to 5 wrong passwords per account per 15 minutes (plus a per-device cap), and sign-ups to 10 per device per hour. Limits are kept in memory and reset when the backend restarts.

## Admin accounts

Admins cannot sign up on the website. Create one from `backend/` (it uses the Atlas database in `backend/.env`):

```bash
npm run create-admin -- admin@example.com "Admin Name"
```

A random password is printed once. Running it again for the same email resets the password. Admins log in on the normal login page and land on **Providers**, where they review documents, approve or send back applications, and suspend, reactivate or remove providers.

## Branches

- `main` — stable, submission-ready code
- `develop` — integration branch; create feature branches from here and merge back via pull request
