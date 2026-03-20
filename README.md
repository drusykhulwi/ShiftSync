# 🏖️ ShiftSync — Multi-Location Staff Scheduling Platform

## 📋 Overview

ShiftSync is a comprehensive workforce scheduling platform built for **Coastal Eats**, a restaurant group operating **4 locations** across **2 time zones**. The platform solves real-world scheduling challenges including staff callouts, overtime costs, unfair shift distribution, and multi-location visibility.

---

## 🌐 Live URLs

| Service | URL |
|---------|-----|
| **Frontend** | [https://shift-sync-omega.vercel.app](https://shift-sync-omega.vercel.app) |
| **Backend API** | [https://shiftsync-backend-pvab.onrender.com/api](https://shiftsync-backend-pvab.onrender.com/api) |
| **GitHub** | [https://github.com/drusykhulwi/ShiftSync.git](https://github.com/drusykhulwi/ShiftSync.git) |

---

## ⚠️ Before You Log In — Wake Up the Backend

The backend is hosted on **Render's free tier**, which automatically spins the server down after periods of inactivity. The first request after sleep can take **50–60 seconds**.

**Follow these steps before attempting to log in:**

1. Open **[https://shiftsync-backend-pvab.onrender.com/api](https://shiftsync-backend-pvab.onrender.com/api)** in a new browser tab
2. Wait until you see a JSON response — this confirms the server is awake
3. Return to the frontend and log in normally

> If login shows a timeout error on the first attempt, simply wait 30 seconds and try again. The server will be ready.

---

## 🔐 Test Credentials

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **Admin** | `admin@coastaleats.com` | `password123` | Full system access |
| **Manager (Downtown)** | `manager.downtown@coastaleats.com` | `password123` | Downtown location only |
| **Manager (Beach)** | `manager.beach@coastaleats.com` | `password123` | Beach location only |
| **Manager (Midtown)** | `manager.midtown@coastaleats.com` | `password123` | Midtown location only |
| **Staff** | `john.doe@coastaleats.com` | `password123` | Self-only access |
| **Staff** | `jane.smith@coastaleats.com` | `password123` | Self-only access |

---

## ✨ Features

### 1. User Management & Roles
- ✅ **Admin** — corporate oversight across all locations
- ✅ **Manager** — runs one or more specific locations
- ✅ **Staff** — works shifts at one or more locations
- ✅ Multi-location certifications and skills tracking
- ✅ Recurring weekly availability + one-off date exceptions

### 2. Smart Shift Scheduling
- ✅ Create shifts with location, date/time, required skills, and headcount
- ✅ No double-booking (same person, overlapping times, across locations)
- ✅ 10-hour minimum rest period between shifts
- ✅ Skill and location certification validation
- ✅ Availability checking with alternative staff suggestions

### 3. Shift Swapping & Coverage
- ✅ Request swaps with specific staff members
- ✅ Drop shifts for anyone qualified to pick up
- ✅ Max 3 pending requests per staff member
- ✅ 24-hour expiration for unclaimed drop requests
- ✅ Manager approval workflow with notifications at every step

### 4. Overtime & Labor Law Compliance

| Rule | Warning | Hard Block |
|------|---------|------------|
| Weekly hours | 35+ hours | 40+ hours |
| Daily hours | 8+ hours | 12+ hours |
| Consecutive days | 6th day | 7th day |
| Rest period | — | < 10 hours |

### 5. Real-Time Features
- ✅ Live schedule updates without page refresh (WebSocket)
- ✅ Instant notifications for swaps, approvals, and assignments
- ✅ "On duty now" dashboard widget
- ✅ Concurrent edit conflict prevention

### 6. Analytics Dashboard
- ✅ Overtime cost projections
- ✅ Fairness scores (Gini coefficient for shift distribution)
- ✅ Hours distribution charts
- ✅ Premium shift tracking (Friday/Saturday evenings)

### 7. Complete Audit Trail
- ✅ Every change logged (who, when, before/after state)
- ✅ Exportable audit logs for compliance

---

## 🏗️ Tech Stack

### Backend (Modular Monolith)
- **Framework**: NestJS 11 with TypeScript
- **Database**: PostgreSQL 15 with Prisma ORM 7
- **Authentication**: JWT with refresh tokens
- **Real-time**: WebSocket via Socket.io
- **Validation**: class-validator + class-transformer

### Frontend (Component-Based)
- **Framework**: Next.js 16 with TypeScript
- **Styling**: Tailwind CSS — primary `#2e6b3e` / secondary `#0a2351`
- **State**: React Hooks + Context API
- **Real-time**: socket.io-client
- **Charts**: Chart.js + react-chartjs-2

### DevOps
- **Frontend**: Vercel
- **Backend + DB**: Render (PostgreSQL)

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 15 (or Docker)
- Git

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/drusykhulwi/ShiftSync.git
cd ShiftSync

# 2. Backend
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run start:dev           # http://localhost:4000

# 3. Frontend (new terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev                 # http://localhost:3000
```

### Environment Variables

**Backend** (`backend/.env`):
```env
DATABASE_URL="postgresql://user:password@localhost:5432/shiftsync"
JWT_SECRET="your-jwt-secret"
JWT_EXPIRATION="1d"
REFRESH_TOKEN_SECRET="your-refresh-token-secret"
REFRESH_TOKEN_EXPIRATION="7d"
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

---


 

## 📁 Project Structure

```
shiftsync/
├── backend/
│   └── src/
│       ├── modules/
│       │   ├── auth/
│       │   ├── users/
│       │   ├── locations/
│       │   ├── skills/
│       │   ├── shifts/
│       │   ├── swap-requests/
│       │   ├── overtime/
│       │   ├── notifications/
│       │   └── audit/
│       └── common/
│
└── frontend/
    └── src/
        ├── pages/
        ├── components/
        ├── hooks/
        ├── services/
        └── types/
```

---

## 🧪 Evaluation Scenarios

### 1. The Sunday Night Chaos
Log in as a manager → find a shift starting within 1 hour → Assign Staff → the system shows only qualified, available staff.

### 2. The Overtime Trap
Try assigning a staff member who would exceed 40 hours. The system blocks with an exact hours message and suggests alternatives.

### 3. The Timezone Tangle
View shifts across locations. Each shift displays in its location's local time regardless of the viewer's timezone.

### 4. The Simultaneous Assignment
Open two browser windows as different managers. Try assigning the same staff member to overlapping shifts. The second attempt receives an instant conflict notification.

### 5. The Fairness Complaint
Analytics → Fairness Report → view the Gini coefficient and premium shift distribution per staff member.

### 6. The Regret Swap
Staff A requests a swap with Staff B. Before manager approval, Staff A cancels. Staff B receives a cancellation notification and the original assignment is restored.

---

## 🤔 Intentional Ambiguities — Decisions Made

| Ambiguity | Decision |
|-----------|----------|
| Historical data on de-certification | Certifications flagged `isActive=false` — no data deleted |
| Desired hours vs. availability | Availability takes precedence; desired hours used for reporting |
| 1-hour shift for consecutive days | Any shift on a calendar day counts as that day worked |
| Shift edited after swap approval | Swap auto-cancelled with notification to both parties |
| Location spanning a timezone boundary | Location's primary timezone used for all shift times |

---

## 📊 Evaluation Criteria

| Criteria | Weight | Status |
|----------|--------|--------|
| Constraint enforcement | 25% | ✅ All labor law rules enforced with clear messages |
| Edge case handling | 20% | ✅ Overnight shifts, DST, concurrent edits handled |
| Real-time functionality | 15% | ✅ WebSocket for all live updates |
| UX & clarity of feedback | 15% | ✅ Toast notifications, inline errors, alternatives shown |
| Data integrity | 15% | ✅ DB transactions + full audit trail |
| Code organisation | 10% | ✅ Modular monolith + component-based frontend |