# TicketNest — Smart Event Booking & Management Platform

TicketNest is a production-grade, multi-tenant event ticketing and management platform. It features atomic ticket inventory locking, a temporary 10-minute hold reservation engine, simulated asynchronous payment processing, multi-tenant organizer data isolation, and live event analytics.

---

## 🌟 Key Architecture & Capabilities

1. **Concurrency Protection & Zero Overselling**:
   - Uses atomic database transaction locks on ticket categories.
   - For every reservation: verifies reserved + sold + requested <= totalQuantity.
   - Tested under contention (e.g. 20 concurrent attendees competing for 10 tickets: exactly 10 succeed, 10 cleanly rejected).

2. **10-Minute Temporary Hold Engine & Expiration Worker**:
   - Holds selected tickets for exactly 10 minutes upon reservation.
   - An asynchronous background worker runs periodically to identify expired reservations and restore held inventory.
   - Live visual countdown timer on checkout with urgency styling.

3. **Simulated Asynchronous Payment Gateway**:
   - Emulates real-world payment flows with configurable network latency (200ms–3500ms).
   - Test options for Instant Approval, Bank Decline, and Webhook Callbacks.
   - Idempotency keys prevent duplicate orders or duplicate inventory deductions on webhook retries.

4. **Multi-Tenant Architecture**:
   - **Platform Administrator**: Moderates events, manages user statuses, verifies organizer credentials, audits all transactions.
   - **Event Organizer**: Isolated tenant workspace to create events, configure ticket tiers (Platinum, Gold, Standard), track ticket sales, and view conversion funnels.
   - **Attendee**: Discovers events, reserves tickets, checks out, accesses QR digital passes, and cancels eligible bookings with automated refund simulations.

5. **Organizer Analytics (Recharts)**:
   - Daily and weekly sales velocity trends.
   - Revenue distribution by ticket category.
   - Booking conversion rate calculation (Confirmed Bookings / Reservation Attempts).
   - Attendee registration reports with one-click CSV export.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, React Router 7 |
| **Backend** | Node.js, Express.js, TypeScript |
| **Database** | PostgreSQL with Prisma ORM (prisma/schema.prisma) |
| **Caching** | Redis with tag-based invalidation & in-memory fallback |
| **Background Processing** | BullMQ & In-Memory Worker for 10-minute hold expiration |
| **Data Visualization** | Recharts (Area charts, Bar charts, Funnels) |
| **Testing** | Automated test suite (tests/run-tests.ts), Postman Collection |

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Run Development Server
```bash
npm run dev
```
The application will be live at `http://localhost:3000`.

---

## 🧪 Automated Test Suite

Run the automated backend test suite verifying concurrency, expiration, payment failure, webhook idempotency, and tenant isolation:

```bash
npm test
# Or: npx tsx tests/run-tests.ts
```

### Test Scenarios Covered:
- **Scenario 1 (Concurrent Booking)**: 20 simultaneous attendees requesting 1 ticket from a pool of 10. Exactly 10 succeed, 10 are rejected with insufficient inventory errors.
- **Scenario 2 (Expired Hold Worker)**: Expired reservations release held inventory and cannot be checked out.
- **Scenario 3 (Payment Failure)**: Rejected payment does not generate confirmed orders or tickets.
- **Scenario 4 (Duplicate Webhook Idempotency)**: Repeated successful payment callbacks return `IDEMPOTENT_IGNORED` and do not double-deduct inventory.
- **Scenario 5 (Tenant Isolation)**: Organizers cannot access or modify another organization's private records.

---

## 🐳 Docker Compose Setup

Run PostgreSQL, Redis, and the TicketNest app together with Docker Compose:

```bash
docker-compose up --build
```

Services:
- **Web App**: `http://localhost:3000`
- **PostgreSQL**: `localhost:5432` (User: `ticketnest_user`, DB: `ticketnest_db`)
- **Redis**: `localhost:6379`

---

## 👤 Default Demo Accounts

Use the **1-Click Role Switcher** in the top navigation bar, or log in with:

| Role | Email | Password | Scope |
|---|---|---|---|
| **Platform Administrator** | `admin@ticketnest.io` | `admin123` | Full system moderation & audit logs |
| **Event Organizer** | `organizer@pulsefest.io` | `organizer123` | PulseLive Experiences events & revenue |
| **Event Organizer 2** | `organizer@summit.org` | `organizer123` | Apex Horizon Summits |
| **Attendee** | `attendee@example.com` | `attendee123` | Ticket booking & digital passes |
