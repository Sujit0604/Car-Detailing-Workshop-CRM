# KromDetail — Car Detailing Workshop(CRM)

A full-stack MERN CRM for a car detailing workshop business. This is not just a
marketing website with a booking form: it is an operations system that carries a
vehicle from appointment through inspection, estimate approval, workshop
execution, quality control, invoicing and payment, with every state change
recorded in an audit trail.

**Live Demo:** []()

Three applications live in this repository:

| App | Purpose | Dev URL |
| --- | --- | --- |
| `Client` | Customer-facing site plus the customer dashboard and the workshop-staff console | http://localhost:5173 |
| `Admin` | Platform administration console (users, workshops, master data, cross-workshop oversight) | http://localhost:5174 |
| `Server` | Express + MongoDB REST API containing all business logic | http://localhost:8001 |

---

## Table of contents

- [What makes this a CRM](#what-makes-this-a-crm)
- [Repository layout](#repository-layout)
- [Tech stack](#tech-stack)
- [Roles](#roles)
- [The job lifecycle](#the-job-lifecycle)
- [Features](#features)
- [Data model](#data-model)
- [API reference](#api-reference)
- [Getting started](#getting-started)
- [Demo accounts](#demo-accounts)
- [Available scripts](#available-scripts)
- [Environment variables](#environment-variables)
- [Security notes](#security-notes)
- [Implementation notes](#implementation-notes)
- [Author](#author)

---

## What makes this a CRM

Most detailing sites stop at "book a slot". This one models the whole trade:

- **Slot-aware booking.** Workshops declare their own opening hours, slot
  duration and per-slot capacity. Bookings are validated against real
  availability rather than an arbitrary date field.
- **Two-stage job card.** A confirmed booking is converted into a `Job` — a work
  order with its own 14-state lifecycle, a service advisor, a workshop manager,
  an assigned mechanic, odometer-in/out readings and internal notes.
- **Inspection before estimate.** A mechanic records a per-component inspection
  (`BEFORE`/`AFTER` damage, condition grade, photos, recommended action) which
  becomes the basis for the estimate. This is what turns a guess into a quote.
- **Versioned estimates with customer approval.** Estimates are versioned
  (`EST-2026-001`, version 1, 2, …), can be `PENDING_APPROVAL`, `APPROVED` or
  `REJECTED`, and carry the customer's written response. A rejection sends the
  job back for revision rather than losing the work.
- **Workshop execution.** A job is broken into sequenced `JobTask`s (with
  estimated vs. actual minutes and a `BLOCKED` state plus reason) and `JobPart`
  lines that reserve and then consume real stock.
- **Live inventory accounting.** `InventoryPart` tracks quantity, reserved
  quantity, reorder level and max stock. Reserving a part increments
  `reservedQuantity`; consuming it decrements `quantity`. Every movement records
  `reasonOfLastAdjustment`.
- **Invoicing from the approved estimate.** Invoices are generated against a job
  and freeze snapshots of the customer, vehicle, booking, job and estimate, so
  later edits to master data can never rewrite history on a document that was
  already issued.
- **Payments, online and offline.** Razorpay orders with signature verification
  and a signature-checked webhook, plus manual `CASH` / `UPI` / `CARD` receipts
  recorded by staff. Payments roll up into `PARTIALLY_PAID` → `PAID`, with
  refunds supported.
- **Role-permitted state machine.** Not every role can move a job to every
  next state. The allowed transitions and the roles permitted to make them are
  enforced on the server (`job.service.js`) and mirrored in the UI
  (`utils/transitions.js`) so buttons are only rendered when the API would
  accept them.
- **Multi-tenant data isolation.** Staff are posted to exactly one workshop.
  `utils/workshopScope.js` pins every read and write of workshop-scoped data to
  the caller's own workshop, so a manager at one branch can never page through
  another branch's bookings or stock.
- **Audit trail.** Invoices, payments, reviews, inspections, task transitions and
  notifications write `AuditLog` entries recording actor, role, action, entity,
  before/after values and the originating request.

---

## Repository layout

```
Car-Detailing-Workshop-CRM/
├── Client/                       # Customer site + customer + workshop-staff SPA
│   ├── public/
│   └── src/
│       ├── components/           # Navbar, AuthModal, ProtectedRoute, RoleRoute, StaffRoute…
│       ├── contexts/             # AuthContext, authContext
│       ├── data/                 # siteData.js (landing page content)
│       ├── pages/
│       │   ├── public/           # LandingPage, Login, Register
│       │   ├── customer/         # Dashboard, Vehicles, BookService, Bookings,
│       │   │                     # JobDetail, Payments, Invoices, Reviews
│       │   └── workshop/         # JobBoard, JobDetail, WorkshopBookings,
│       │                         # BookingDetail, Inventory, Notifications
│       ├── routes/AppRouter.jsx  # createBrowserRouter tree + role guards
│       ├── services/             # axios wrappers per resource + razorpayCheckout
│       └── utils/                # transitions.js, vehicle.js, workshop.js
│
├── Admin/                        # Platform admin SPA
│   └── src/
│       ├── components/           # AdminNav, AdminRoute, ProtectedRoute, StatusBadge…
│       ├── contexts/             # AuthContext, authContext
│       ├── pages/
│       │   ├── public/           # AdminLogin (secret-key reveal gate)
│       │   └── admin/            # Dashboard, Users, Workshops, Services,
│       │                         # ServiceCategories, Bookings, Jobs, Inventory,
│       │                         # Invoices, Payments, Reviews, Inspections,
│       │                         # Notifications, AuditLogs
│       ├── routes/AppRouter.jsx
│       └── services/             # axios wrappers per resource
│
├── Server/                       # Express 5 REST API
│   ├── scripts/seedAll.js        # Idempotent full demo seed
│   ├── uploads/                  # Local multer storage (gitignored)
│   ├── logs/                     # Winston output (gitignored)
│   └── src/
│       ├── server.js             # Boot: env → db → listen
│       ├── app.js                # Middleware chain + route mounting
│       ├── config/               # env.js, db.js, cloudinary.js, EmailConfig.js
│       ├── models/               # 20 Mongoose schemas
│       ├── validators/           # Zod schemas per resource
│       ├── middleware/           # auth, role, validation, upload, rateLimiter, error
│       ├── routes/               # 20 routers mounted under /api/v1
│       ├── services/             # All business logic lives here
│       └── utils/                # ApiError, ApiResponse, jwt, password, logger,
│                               #   asyncHandler, workshopScope, generateOTP, Email
│
└── README.md
```

The backend follows a strict **routes → services → models** layering. Route
files only do auth, validation and delegation; every rule about what is allowed,
what a status change means, and what a document costs lives in `src/services`.

---

## Tech stack

**Server** — Node.js 18+ (developed on v24), Express 5, Mongoose 9, MongoDB,
Zod 4, JWT (access + refresh, separate secrets), bcryptjs, Multer 2 +
Cloudinary, Nodemailer (SMTP) or the Resend HTTPS API, Razorpay, Helmet, CORS, compression, cookie-parser,
`express-mongo-sanitize`, HPP, `express-rate-limit`, Morgan, Winston.

**Client / Admin** — React 19, Vite 8 (with the React Compiler via Babel),
React Router 7, Redux Toolkit, axios, React Hook Form + Zod resolvers,
Tailwind CSS 4, Recharts, date-fns, Lucide icons, react-hot-toast.

---

## Roles

Five roles, defined in `models/User.js`.

| Role | Scope | What they do |
| --- | --- | --- |
| `CUSTOMER` | Own data only | Manage vehicles, book services, approve/reject estimates, track their job live, pay invoices, leave reviews |
| `MECHANIC` | Assigned workshop | Job board, per-task start/complete/block, record inspections, attach before/after media, complete tasks and parts |
| `SERVICE_ADVISOR` | Assigned workshop | Check vehicles in, run inspections, build estimates, respond to job status, issue and void invoices, record offline payments, respond to reviews |
| `WORKSHOP_MANAGER` | Assigned workshop | Everything an advisor can do, plus inventory/stock management, mechanic assignment, quality check, ready/deliver transitions |
| `ADMIN` | Platform-wide | Users, workshops, service categories, services, coupons, cross-workshop bookings/jobs, inspections, notifications and the audit log |

Staff isolation is enforced by `utils/workshopScope.js`:
`WORKSHOP_MANAGER`, `SERVICE_ADVISOR` and `MECHANIC` are pinned to their own
`workshopId` (mechanics resolve theirs through their `Mechanic` profile). Any
attempt to address a different workshop returns `403`.

---

## The job lifecycle

Enforced server-side in `services/job.service.js` and mirrored in
`Client/src/utils/transitions.js`.

```
CREATED
  → CHECK_IN              (advisor, manager, admin)
  → INSPECTION            (advisor, manager, admin)
  → ESTIMATE_PENDING      (advisor, manager, admin)
  → CUSTOMER_APPROVAL     (advisor, manager, admin)
  → APPROVED              (advisor, manager, admin)
  → ASSIGNED              (advisor, manager, admin)
  → IN_PROGRESS           (mechanic, manager, admin)
  → QUALITY_CHECK         (mechanic, manager, admin)
  → READY                 (manager, admin)
  → DELIVERED             (advisor, manager, admin)
  → COMPLETED             (advisor, manager, admin)

CANCELLED may be reached from CREATED, CHECK_IN, INSPECTION, ESTIMATE_PENDING,
CUSTOMER_APPROVAL, APPROVED, IN_PROGRESS and REWORK.
REWORK loops back to IN_PROGRESS or QUALITY_CHECK from INSPECTION, ASSIGNED,
IN_PROGRESS, QUALITY_CHECK.
```

A `REJECTED` estimate routes the job back to `ESTIMATE_PENDING` for a revised
version. The parallel booking lifecycle is
`PENDING → CONFIRMED → VEHICLE_RECEIVED → IN_PROGRESS → COMPLETED`, with
`CANCELLED` and `NO_SHOW` as terminal exits, and payment status tracked
independently as `PENDING | PARTIAL | PAID | FAILED | REFUNDED`.

---

## Features

### Customer
Landing page with services, packages, process, gallery, stats and testimonials ·
email/password registration with OTP verification · vehicle garage (CRUD with
image upload) · service catalogue filtered by workshop with duration and price ·
booking form with slot and coupon selection · booking list and detail ·
live job tracking with status timeline, task progress, photos and inspection
findings · estimate approval/rejection with remarks · Razorpay checkout for
issued invoices · invoice history · payment history · review submission with
photos · workshop review responses · in-app notifications.

### Workshop staff
Job board scoped to the branch with status/assignment filters · job detail with
check-in, mechanic assignment, status transitions gated by role, task
management, part reservation and return · inspection capture per component with
condition grading and recommended actions · before/damage/after media upload ·
estimate builder with live price breakup and version control · inventory with
stock adjustments, reorder-level flags and low-stock indicators · offline payment
recording · review responses.

### Admin
Platform dashboard with aggregate stats and Recharts visualisations · user
management (create, activate/block, change role, reassign workshop) · workshop
management (address, GeoJSON location, opening hours, slot duration, capacity) ·
service category and per-workshop service catalogue management · cross-workshop
bookings and jobs · invoices, payments, reviews and inspections oversight ·
notification broadcast · audit log browser with actor, action, entity and
before/after diffs.

---

## Data model

20 Mongoose models. Core relationships:

```
User ──workshopId──> Workshop
User (MECHANIC) ──1:1──> Mechanic ──workshopId──> Workshop
Vehicle ──ownerId──> User,  images[]
Workshop ──services──> Service ──categoryId──> ServiceCategory
Booking ──customerId/vehicleId/workshopId──,  services[],  pricing, couponId
Job ──bookingId (1:1 unique)──,  assignedMechanicId, serviceAdvisorId,
     workshopManagerId,  odometerIn/Out
  ├── JobTask[]     sequenced work, assigned mechanic, estimated vs actual minutes
  ├── JobPart[]     inventoryPartId, quantity, RESERVED | USED | RETURNED
  ├── Inspection[]  INITIAL | FINAL, items[] with condition + photos
  ├── Estimate[]    versioned, items, pricing, customer response
  ├── Media[]       ownerType VEHICLE | JOB | USER, category BEFORE/DAMAGE/AFTER/PROFILE
  └── Invoice (1:1) snapshots + InvoiceLine[] + pricing
Payment ──invoiceId──> Invoice   (gateway order, verify, webhook, offline, refund)
Review  ──bookingId──> Booking   (rating, images, staff response, moderation)
Notification ──userId──> User     (IN_APP, dedupeKey, read state)
AuditLog             actor + action + entity + oldValue/newValue + requestId
Coupon               PERCENTAGE | FIXED, min order, usage + per-user limits
```

### Response envelope

Success:

```json
{ "success": true, "message": "…", "data": { } }
```

Failure:

```json
{ "success": false, "message": "…", "errors": [ ] }
```

Unknown routes return `404 { "success": false, "message": "Route not found" }`.

---

## API reference

Base URL: `http://localhost:8001/api/v1`

All routes except registration, login, OTP verification, token refresh, the
published reviews feed and the public master data require
`Authorization: Bearer <accessToken>`. The access token is also accepted from an
`accessToken` cookie.

### Auth — `/auth`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/register` | – | Create account, sends verification code |
| POST | `/login` | – | Email + password; returns tokens or an OTP challenge |
| POST | `/verify-otp` | – | Verify the emailed code, issue tokens |
| POST | `/refresh` | – | Rotate the refresh token, return a fresh access token |
| POST | `/logout` | refresh | Revoke the stored refresh token |

Login has two branches worth knowing: an account that has never verified is sent
an OTP instead of tokens, and any account older than the `threeDayExpires` gate
is forced back into OTP re-verification on the next login.

### Workshops — `/workshops`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/` | public | List / search workshops |
| POST | `/` | admin | Create workshop |
| GET | `/:id` | public | Workshop detail with services |
| GET | `/:id/overview` | staff | Branch operating summary |
| GET | `/:id/staff` | staff | Advisors, managers and mechanics at the branch |
| PATCH | `/:id` | admin | Update profile, hours, slot config |
| DELETE | `/:id` | admin | Remove workshop |

### Service catalogue

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET/POST | `/service-categories` | public / admin | List, create categories |
| GET/PATCH/DELETE | `/service-categories/:id` | public / admin | Read, update, remove |
| GET/POST | `/services` | public / admin | List (filter by workshop/category), create |
| GET/PATCH/DELETE | `/services/:id` | public / admin | Read, update, remove |

### Vehicles — `/vehicles`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET/POST | `/` | customer | List own vehicles, add vehicle |
| GET/PATCH/DELETE | `/:id` | owner/admin | Read, update, remove |
| POST | `/:id/images` | owner/admin | Upload vehicle images |
| DELETE | `/:id/images` | owner/admin | Remove a vehicle image |

### Bookings — `/bookings`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/` | customer | Create booking (slot + services + coupon) |
| GET | `/mine` | customer | Customer's own bookings |
| GET | `/workshop/:workshopId` | staff/admin | Branch bookings, scoped |
| GET | `/:id` | owner/staff/admin | Booking detail |
| PATCH | `/:id/status` | staff/admin | Advance status |
| PATCH | `/:id/payment-status` | staff/admin | Update payment status |
| POST | `/:id/cancel` | customer/staff/admin | Cancel with reason |

### Jobs — `/jobs`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/` | staff/admin | Create a job card from a booking |
| GET | `/` | staff/admin | Filter by status, workshop, mechanic |
| GET | `/workshop/:workshopId` | staff/admin | Branch job board |
| GET | `/:id` | customer/staff/admin | Full job detail (role-filtered) |
| PATCH | `/:id/status` | per-transition roles | Advance the state machine |
| POST | `/:id/check-in` | advisor/manager/admin | Record check-in and odometer-in |
| PATCH | `/:id/assign-mechanic` | manager/admin | Assign or reassign a mechanic |
| POST | `/:id/estimate` | advisor/manager/admin | Create a new estimate version |
| GET | `/:id/estimate` | customer/staff/admin | Current estimate |
| POST | `/:id/estimate/respond` | customer | Approve or reject with remarks |

### Job tasks — `/jobs/:jobId/tasks`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET/POST | `/` | staff/admin | List, add a sequenced task |
| PATCH | `/:taskId` | staff/admin | Edit task details or assignment |
| PATCH | `/:taskId/status` | mechanic/manager/admin | PENDING / IN_PROGRESS / BLOCKED / COMPLETED |
| DELETE | `/:taskId` | advisor/manager/admin | Remove task |

### Job parts — `/jobs/:jobId/parts`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET/POST | `/` | staff/admin | List, reserve stock for the job |
| PATCH | `/:partId/status` | staff/admin | RESERVED → USED / RETURNED, adjusts stock |
| POST | `/:partId/cancel` | staff/admin | Release a reservation |
| DELETE | `/:partId` | advisor/manager/admin | Remove the line and release stock |

### Inspections — `/inspections`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/` | mechanic/advisor/manager/admin | Record an inspection with component items |
| GET | `/` | staff/admin | Filter by job, type, status |
| GET | `/:id` | customer/staff/admin | Inspection detail |
| PATCH | `/:id` | author/manager/admin | Edit a draft |
| POST | `/:id/complete` | inspector/manager/admin | Finalise the inspection |

### Media — `/media`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/jobs/:jobId` | staff/admin | Upload before / damage / after media |
| GET | `/jobs/:jobId` | customer/staff/admin | List media for a job |
| DELETE | `/:id` | owner/manager/admin | Remove media |

### Inventory — `/inventory`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET/POST | `/` | staff/admin | List with low-stock filter, add part |
| GET/PATCH/DELETE | `/:id` | staff/admin | Read, update, remove part |
| PATCH | `/:id/stock` | manager/admin | Adjust quantity with a reason |

### Mechanics — `/mechanics`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/me` | mechanic | Own mechanic profile |
| GET | `/` | staff/admin | List branch mechanics with availability |

### Invoices — `/invoices`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/` | advisor/manager/admin | Generate an invoice from an approved estimate |
| GET | `/mine` | customer | Customer's invoices |
| GET | `/` | staff/admin | Branch invoice list with filters |
| GET | `/:id` | customer/staff/admin | Invoice detail with snapshots and lines |
| PATCH | `/:id/issue` | advisor/manager/admin | Issue the draft, set due date |
| PATCH | `/:id/void` | manager/admin | Void an invoice |

### Payments — `/payments`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/order` | customer | Create a Razorpay order (`503` if unconfigured) |
| POST | `/:id/verify` | customer | Verify the signature and mark paid |
| GET | `/mine` | customer | Payment history |
| GET | `/`, `/ :id` | staff/admin | Branch payments, payment detail |
| POST | `/` | advisor/manager/admin | Record an offline payment |
| POST | `/:id/refund` | manager/admin | Refund a payment |
| POST | `/webhooks/razorpay` | signature | Razorpay webhook (raw body, signature checked) |

### Reviews — `/reviews`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/published` | public | Published reviews for the landing page |
| POST | `/` | customer | Review a completed, paid booking |
| GET | `/mine` | customer | Own reviews |
| GET | `/`, `/ :id` | staff/admin | Branch reviews, review detail |
| POST | `/:id/images` | customer | Add review photos |
| DELETE | `/:id/images` | customer | Remove review photos |
| PATCH | `/:id/response` | advisor/manager/admin | Staff response |
| PATCH | `/:id/moderate` | admin | Publish or hide |

### Notifications — `/notifications`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/` | staff/admin | Create a notification for a user |
| POST | `/broadcast` | admin | Fan out to a role or the whole platform |
| GET | `/mine` | any | Own notifications |
| GET | `/unread-count` | any | Badge count |
| GET | `/admin` | admin | All notifications with filters |
| PATCH | `/:id/read`, `/read-all` | any | Mark read |

Types: `BOOKING_CONFIRMED`, `BOOKING_CANCELLED`, `JOB_STARTED`, `JOB_COMPLETED`,
`VEHICLE_READY`, `ESTIMATE_READY`, `ESTIMATE_APPROVED`, `INVOICE_ISSUED`,
`INVOICE_PAID`, `PAYMENT_SUCCESS`, `PAYMENT_FAILED`, `REVIEW_UPDATED`,
`REVIEW_RESPONSE`, `GENERAL`. Each carries a `dedupeKey` so the same event
cannot spam a user twice.

### Admin — `/admin`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/stats` | admin | Platform-wide dashboard counters |
| GET/POST | `/users` | admin | List, create users |
| PATCH | `/users/:id/status` | admin | ACTIVE / INACTIVE / BLOCKED |
| PATCH | `/users/:id/role` | admin | Change role |
| PATCH | `/users/:id/workshop` | admin | Reassign workshop |
| GET | `/bookings`, `/jobs` | admin | Cross-workshop oversight |

### Audit — `/audit-logs`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/` | admin | Filter by actor, action, entity type, date range |
| GET | `/:id` | admin | Full entry with before/after values |

---

## Getting started

### Prerequisites

- Node.js 18 or newer (this project was built on v24.14.1)
- npm 10 or newer
- A running MongoDB instance — local `mongod`, Docker, or a MongoDB Atlas URI

### 1. Clone and install

```bash
git clone <repo-url>
cd Car-Detailing-Workshop-CRM

npm install --prefix Server
npm install --prefix Client
npm install --prefix Admin
```

### 2. Configure environment files

Each package ships a `.env.example`. Copy it and fill in your values.

```bash
# Server
cp Server/.env.example Server/.env

# Client
cp Client/.env.example Client/.env

# Admin
cp Admin/.env.example Admin/.env
```

On PowerShell:

```powershell
Copy-Item Server/.env.example Server/.env
Copy-Item Client/.env.example Client/.env
Copy-Item Admin/.env.example Admin/.env
```

At minimum, for the Server:

```dotenv
NODE_ENV=development
PORT=8001
MONGO_URI=mongodb://127.0.0.1:27017/kromdetail

ACCESS_TOKEN_SECRET=<long random string>
REFRESH_TOKEN_SECRET=<different long random string>
```

Generate the two JWT secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

For the two frontends, the only required variable is the API base URL, which
must match the Server port:

```dotenv
VITE_API_URL=http://localhost:8001/api/v1
```

Razorpay and Cloudinary are optional. Leaving `RAZORPAY_KEY_ID` empty makes
`POST /api/v1/payments/order` return `503` and hides the checkout button, but
invoices and offline payments keep working. Leaving `CLOUDINARY_*` empty falls
back to local disk storage under `Server/uploads`.

### 3. Seed the database

The seed is idempotent — every collection is upserted by a natural key, so you
can re-run it safely at any time to restore the demo dataset.

```bash
cd Server
npm run seed:all
```

It creates 2 workshops, 8 services, 3 categories, 2 coupons, 12 users,
4 mechanics, 6 vehicles, 7 bookings, 7 jobs, 5 estimates, 10 inventory parts,
2 inspections, 7 tasks, 4 job parts, 2 invoices, 2 payments, 1 review,
6 notifications and 8 audit log entries — spread across every stage of the
lifecycle so all three dashboards have realistic data on first load.

### 4. Run the three apps

In three separate terminals:

```bash
# Terminal 1 — API
cd Server && npm start           # nodemon src/server.js, http://localhost:8001

# Terminal 2 — customer app + workshop console
cd Client && npm run dev         # http://localhost:5173

# Terminal 3 — admin console
cd Admin && npm run dev          # http://localhost:5174
```

Verify the API is up:

```bash
curl http://localhost:8001/
# Authentication API running
```

The landing page is at http://localhost:5173, the staff console at
http://localhost:5173/workshop/jobs (after logging in as staff), and the admin
console at http://localhost:5174.

---

## Demo accounts

Created by `npm run seed:all`. All seeded accounts are pre-verified and
`ACTIVE`, so you can log in with a password immediately.

| Role | Email | Password | Notes |
| --- | --- | --- | --- |
| Admin | `admin@kromdetail.com` | `Admin@123` | Full platform access |
| Workshop manager | `aarav@kromdetail.com` | `Staff@123` | Shain Detailing Studio (`SHAIN-01`) |
| Workshop manager | `meera@kromdetail.com` | `Staff@123` | Speed X Performance (`SPEED-02`) |
| Service advisor | `rohan@kromdetail.com` | `Staff@123` | Shain |
| Service advisor | `divya@kromdetail.com` | `Staff@123` | Speed X |
| Mechanic | `karan@kromdetail.com` | `Staff@123` | Shain, detailing/body/paint |
| Mechanic | `vikram@kromdetail.com` | `Staff@123` | Shain, detailing/engine |
| Mechanic | `anil@kromdetail.com` | `Staff@123` | Speed X, engine/brakes |
| Mechanic | `suresh@kromdetail.com` | `Staff@123` | Speed X, electrical/AC/tyre |
| Customer | `priya@example.com` | `Customer@123` | 2 vehicles, bookings 1 and 7 |
| Customer | `arjun@example.com` | `Customer@123` | 2 vehicles, bookings 2 and 5 |
| Customer | `sweety@example.com` | `Customer@123` | 2 vehicles, bookings 3 and 6 |

Useful starting points for exploring the flow:

- Log in as `arjun@example.com` and open the estimate on job `JOB-2026-0004` to
  see an `APPROVED` estimate with a customer response.
- Job `JOB-2026-0005` has a `PENDING_APPROVAL` estimate and job
  `JOB-2026-0006` has a `REJECTED` one, so you can exercise both approval paths
  as the customer.
- Job `JOB-2026-0003` is sitting in `INSPECTION` with a draft inspection, a
  `BLOCKED` task and a reserved part — a good showcase of the workshop console.
- Log in as `rohan@kromdetail.com` for the Shain branch, or
  `meera@kromdetail.com` for Speed X, to see the workshop isolation in action:
  neither can see the other's bookings or stock.

These credentials are demo-only. Rotate or remove them before deploying anywhere
public.

---

## Available scripts

| Location | Command | Does |
| --- | --- | --- |
| `Server` | `npm start` | Run the API with nodemon |
| `Server` | `npm run seed:all` | Idempotent full demo seed |
| `Server` | `npm test` | Not implemented |
| `Client` / `Admin` | `npm run dev` | Vite dev server with `--host` |
| `Client` / `Admin` | `npm run build` | Production build into `dist/` |
| `Client` / `Admin` | `npm run preview` | Serve the production build locally |
| `Client` / `Admin` | `npm run lint` | ESLint |

---

## Environment variables

### `Server/.env`

| Variable | Required | Default / notes |
| --- | --- | --- |
| `NODE_ENV` | yes | `development` enables Morgan request logging |
| `PORT` | yes | `8001` — must match the frontends' `VITE_API_URL` |
| `MONGO_URI` | yes | e.g. `mongodb://127.0.0.1:27017/kromdetail` |
| `ACCESS_TOKEN_SECRET` | yes | Long random string |
| `ACCESS_TOKEN_EXPIRES` | no | `15m` |
| `REFRESH_TOKEN_SECRET` | yes | Must differ from the access secret |
| `REFRESH_TOKEN_EXPIRES` | no | `7d` |
| `JWT_AUDIENCE` / `JWT_ISSUER` | no | `kromdetail-api` / `kromdetail` |
| `BCRYPT_SALT_ROUNDS` | no | `10` |
| `OTP_LENGTH` / `OTP_EXPIRY_MINUTES` | no | `6` / `10` |
| `CLIENT_URL` | no | `http://localhost:5173`, used for CORS and email links |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | no | Empty falls back to local `Server/uploads` |
| `MAIL_PROVIDER` | no | `auto` — picks `resend` when `RESEND_API_KEY` is set, else `smtp` |
| `MAIL_FROM` / `MAIL_FROM_NAME` | no | Sender address for OTP emails; must be a verified address on Resend |
| `RESEND_API_KEY` | no | Sends over HTTPS, so it works on Render's free tier |
| `SMTP_USER` / `SMTP_PASS` | no | Empty disables OTP emails — you will not be able to complete verification for new accounts. SMTP needs outbound port 465/587, which Render's free web services block, so use `MAIL_PROVIDER=resend` with `RESEND_API_KEY` there |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX_REQUESTS` | no | `900000` / `100` (limiter is wired but currently disabled in `app.js`) |
| `RAZORPAY_KEY_ID` / `_KEY_SECRET` | no | Empty disables online checkout |
| `RAZORPAY_WEBHOOK_SECRET` | no | Empty makes the webhook return `503` |
| `CRYPTO_SECRET` / `_ALGORITHM` / `_IV` | no | Declared in `config/env.js` but not yet consumed — reserved for encrypting notification payloads at rest |

### `Client/.env`

| Variable | Required | Notes |
| --- | --- | --- |
| `VITE_API_URL` | yes | `http://localhost:8001/api/v1` |
| `VITE_RAZORPAY_KEY_ID` | no | Public key id only. Empty hides the checkout button |

### `Admin/.env`

| Variable | Required | Notes |
| --- | --- | --- |
| `VITE_API_URL` | yes | Must match the Client's |
| `VITE_ADMIN_SECRET_KEY` | no | Comma-separated reveal-gate sequence for the login screen (default `k,r,o,m`) |

> The admin secret key is a UI convenience only. It reveals the login form and
> grants no access whatsoever — the server still authenticates and authorises
> every request.

---

## Security notes

- Passwords are hashed with bcrypt and the field is `select: false`, so it never
  leaks through a normal query.
- Access tokens are short-lived. A single refresh token is stored on the user
  document and re-issued on every refresh; it is cleared on logout, and a
  refresh attempt with a token that no longer matches the stored one revokes the
  session.
- The frontends queue requests behind a single in-flight refresh on `401`, so a
  burst of expiring requests does not spam the refresh endpoint or log the user
  out mid-navigation.
- `helmet`, `cors`, `compression`, `express-mongo-sanitize` and `hpp` are all
  applied globally. The JSON body limit is `50kb`.
- Zod validation runs on every mutating route; `ApiError` instances carry a
  status and message straight to the client.
- The Razorpay webhook router is mounted **before** `express.json()` because
  Razorpay signs the untouched raw payload, and the signature is verified before
  the body is parsed.
- Workshop-scoped reads and writes go through `workshopScope.js`, which pins
  staff to their own branch and returns `403` on a cross-branch attempt.
- Multi-tenancy is enforced in the service layer, not the UI, so hiding a button
  is never the only protection.
- `.env` is gitignored in all three packages, along with `Server/uploads` and
  `Server/logs`. Never commit real credentials.
- Anything in a `VITE_`-prefixed variable is bundled into the browser build and
  is public. Only the Razorpay **key id** belongs in a frontend `.env`; the key
  secret and webhook secret must stay on the server.

---

## Implementation notes

A few decisions worth calling out, since they are not obvious from the file
tree:

- **Route ordering matters.** In `app.js`, `jobTaskRouter` and `jobPartRouter`
  are mounted at `/api/v1/jobs/:jobId/tasks` and `/api/v1/jobs/:jobId/parts`
  *before* `jobRouter` at `/api/v1/jobs`, otherwise the wildcard `/:id` route
  would swallow the sub-resource paths.
- **`req.query` is copied** into a plain writable object before `hpp()` runs, so
  HTTP parameter pollution protection does not freeze Express 5's query object.
- **The rate limiter is present but commented out** in `app.js`. Turn it back on
  for any internet-facing deployment.
- **CORS is currently open** (`cors()` with no origin allowlist). The stricter
  `origin: env.CLIENT_URL, credentials: true` variant is commented out directly
  above it — enable it before deploying.
- **Estimates have no dedicated router.** They are nested under a job at
  `/jobs/:id/estimate` and `/jobs/:id/estimate/respond`, because an estimate is
  meaningless without its job.
- **`Coupon` has no public router.** Coupons are created and evaluated inside the
  booking flow, so the model is currently only exercised by the seed and by
  `POST /bookings`.
- **The `CRYPTO_*` variables are dead config today.** They are parsed into
  `config/env.js` and documented, but no module reads them yet.
- **Client-side transition tables mirror the server.** `utils/transitions.js`
  keeps the UI honest about which role can make which move, but the server's
  `ROLE_STATUS_PERMISSIONS` in `services/job.service.js` is the only authority.
  If you change one, change the other.
- **Media storage is pluggable.** With Cloudinary configured, uploads go to the
  CDN and the returned `publicId` enables remote deletion. Without it, Multer
  writes to `Server/uploads/files/<userId>/` and the `publicId` is `null`.
- **The admin login has a "reveal gate"** — you must type the secret key
  sequence before the login form appears. It is pure UX theatre; the server is
  the only thing that matters for access control.

---

## Author

**Sujit Som** — full-stack developer.
