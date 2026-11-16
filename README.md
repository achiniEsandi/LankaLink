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

The landing and professionals pages use the photos in `frontend/public/images/` (free Unsplash photos, credited in `frontend/public/images/CREDITS.md`). To change one, replace the file with a JPG of the same name (about 1200 px wide). If a file is missing, a coloured placeholder or illustration is shown instead.

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

Emails go through the shared SMTP mailer (`backend/src/utils/mailer.js`, also used for password reset).

- **Development:** leave `SMTP_HOST` empty. The email, including the link, is printed in the backend terminal. Open the link in the browser to confirm.
- **Real emails (Gmail):** turn on 2-Step Verification for the Gmail account, create an [App Password](https://myaccount.google.com/apppasswords), then set in `backend/.env`: `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_USER=` your Gmail address, `SMTP_PASS=` the App Password, and `MAIL_FROM=LankaLink <your Gmail address>`. Restart the backend.

Logins are limited to 5 wrong passwords per account per 15 minutes (plus a per-device cap), and sign-ups to 10 per device per hour. Limits are kept in memory and reset when the backend restarts.

## Ratings and reviews (booking contract)

Customers can review a provider once per booking, after the booking is confirmed. Reviews read the `bookings` collection directly, so the booking module must store each booking with:

| Field | Type | Meaning |
|---|---|---|
| `customer` | ObjectId of a `User` (role `customer`) | Who booked |
| `provider` | ObjectId of a `Provider` | Who did the job |
| `status` | string | Reviews open when this is `confirmed` |

The booking screen links customers to `/reviews/new?booking=<booking id>` to leave a review. Ratings are recalculated automatically; admins can hide reviews (they then stop counting), and providers averaging under 3 stars after 3 reviews are flagged in the admin list.

## Bookings

Customers book at `/book` (service cards on the home page link to `/book?service=<type>`), follow progress at `/bookings`, and manage repeat plans in the **Repeat plans** tab. Providers handle requests at `/provider/jobs`; admins see every booking at `/admin/bookings`.

**Lifecycle:** `requested → assigned → accepted → checked_in → completed → confirmed`, or `cancelled`. Each change is logged in the booking's `history`, which drives the customer timeline.

- **Scheduling:** a booking is for a day (tomorrow up to 60 days ahead) and a time of day (morning, afternoon or evening), matching how providers set their availability. A provider is never given two active jobs in the same slot.
- **Matching:** approved providers who offer the service, cover the district and are available that day and time. The best one gets the offer first: highest rating, then most reviews, then fewest upcoming jobs.
- **Accept or decline:** a provider sees the area and job details, and gets the exact address and phone number only after accepting. Declining, or not answering within 24 hours, passes the booking to the next match. If nobody is free the booking waits as `requested`, and the scheduler keeps trying.
- **Cancel and reschedule:** customers can cancel until the provider checks in. They can reschedule until the day before the visit; the same provider is asked first.
- **Repeat bookings:** every week, every 2 weeks or every 4 weeks. Visits are created 4 weeks ahead and stay with the provider who accepted the first one. Pausing or cancelling a plan cancels its future visits.
- **Check-in and completion** are simple buttons for now. Ahmed's GPS check-in and photo proof will replace them without changing the statuses.
- **Scheduler:** `backend/src/utils/scheduler.js` runs every 15 minutes in the server (not in tests). It creates repeat visits, moves unanswered offers on, and retries unmatched bookings.
- **Location:** for now the address is stored on the booking. It can point to Dilshan's Property / FamilyMember records once the customer portal is merged.

Until customer sign-up is merged, create a customer for testing from `backend/`:

```bash
npm run create-customer -- ayesha@example.com "Ayesha Fernando"
```

## Admin accounts

Admins cannot sign up on the website. Create one from `backend/` (it uses the Atlas database in `backend/.env`):

```bash
npm run create-admin -- admin@example.com "Admin Name"
```

A random password is printed once. Running it again for the same email resets the password. Admins log in on the normal login page and land on **Providers**, where they review documents, approve or send back applications, and suspend, reactivate or remove providers.

## Branches

- `main` — stable, submission-ready code
- `develop` — integration branch; create feature branches from here and merge back via pull request
