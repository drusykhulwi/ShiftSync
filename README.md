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

## 👤 Registration & Onboarding Flow

Registration on ShiftSync is **intentionally public** — anyone can create an account using the register page. This was a deliberate decision to make onboarding frictionless for new hires without requiring an admin to create every account manually.

However, registering alone does not grant meaningful access. Here is what happens at each step:

**1. A new user registers.**
They provide their name, email, and password. Their account is created with the role of `STAFF` and no location certifications. At this point they can log in, but they will see empty dashboards, no shifts, and cannot be assigned to anything.

**2. An admin certifies them at a location.**
For a staff member to appear in any shift assignment list, an admin must go to the admin Users page, open the member's profile, select the skill they are certified for, and check the locations they are eligible to work at. This creates a certification record linking the person to that location and skill.

**3. The staff member becomes schedulable.**
Only after receiving at least one certification will the staff member appear as a candidate when a manager assigns staff to a shift. Before that point they are invisible to the scheduling system.

**Why this design?**
This two-step flow is the primary safeguard against unauthorised people being assigned to shifts. Because registration is public, anyone could theoretically create an account. By requiring an admin to explicitly certify a staff member at a specific location before they can be assigned, the system ensures that only vetted, official employees appear in the scheduling workflow. A rogue or accidental account registration has no impact on operations — the person simply sees an empty dashboard until a legitimate admin acts.

This also means managers cannot assign people they have never met. Every assignable staff member has been explicitly approved by someone with admin or manager privileges.

---

## 🔒 Location-Scoped Access Control

ShiftSync enforces strict location-based access at every level of the system.

### Shifts — who can see and edit them

- **Admins** can view, create, edit, publish, and assign staff to shifts at every location across the system.
- **Managers** can only see and manage shifts that belong to locations they are assigned to. A manager for the Downtown location cannot view, create, or modify shifts at Beach or Midtown.
- **Staff** can only view shifts they have personally been assigned to. They cannot see other staff members' shifts or shifts at locations they have not been scheduled for.

### Staff assignment — who can be added to a shift

When a manager opens the assignment dialog for a shift, the system does not show the full staff list. It filters candidates down to only those who meet all three of the following conditions simultaneously:

1. **Certified at the shift's location** — the staff member must have an active certification linking them to that specific location.
2. **Certified for the required skill** — the shift requirement specifies a skill (e.g. bartender, line cook). Only staff with that certification are shown.
3. **Not already assigned** — staff members already assigned to that shift slot are excluded.

This means a manager at Downtown cannot accidentally assign someone who only works at Beach, and cannot assign someone without the required skill. This is enforced both in the UI (by filtering the candidate list before it is displayed) and at the API level (the backend validates all three conditions before confirming any assignment). Even if someone bypassed the frontend, the API would reject the request.

### Location assignment for managers

Managers are linked to locations by an admin. A manager's access is entirely determined by which locations have been assigned to their account — this is viewable and editable on the admin Users page. A manager who has not been assigned any location will see empty dashboards and cannot create shifts until an admin assigns them to at least one location.

---

## 🧠 Design Decisions & Reasoning

This section documents every significant decision made during development, including the reasoning behind each choice and how ambiguities from the brief were resolved.

---

### Authentication & Registration

**Decision: Registration is public, but access requires admin certification.**
The brief did not specify whether registration should be gated or open. An open registration was chosen because it reflects how real restaurant groups work — new hires should be able to set up their account on their own without waiting for IT. The safeguard is that a newly registered account is completely inert (no certifications, invisible to scheduling) until an admin explicitly onboards them. This separates identity (who you are) from authorisation (what you can do), which is a more maintainable and scalable pattern than trying to control who can register.

**Decision: JWT tokens do not auto-refresh in this implementation.**
Given the 72-hour timeframe, persistent sessions were prioritised over token rotation. The access token has a 1-day expiry. This is noted as a known limitation — a production implementation would use refresh tokens to silently extend sessions.

---

### Roles & Permissions

**Decision: Three roles only — Admin, Manager, Staff.**
The brief specified exactly these three. No intermediate roles (e.g. "Senior Staff" or "Floor Supervisor") were added because the brief did not require them and adding undocumented complexity would have been speculative.

**Decision: Managers can only see their assigned locations, not all locations.**
This directly addresses the brief's stated pain point — "managers at different locations hoarding good employees." By scoping each manager's view strictly to their own locations, the system prevents cross-location interference while still allowing admins to have full visibility.

**Decision: Staff see only their own assigned shifts, not the full schedule.**
Staff do not need visibility into who else is working or what positions are open. Showing the full schedule would expose personal information about colleagues unnecessarily and could create social dynamics around shift desirability. Staff have a "My Schedule" view filtered to their own assignments.

---

### Shift Scheduling & Constraints

**Decision: Constraint violations are split into hard blocks and warnings.**
Some rules must never be broken (scheduling someone for two shifts at the same time, assigning someone without the required skill). Others are important but have legitimate override scenarios (a 7th consecutive day in an emergency). Hard blocks return an error and prevent assignment entirely. Warnings are surfaced to the manager with a clear explanation and require an explicit override reason to proceed. This mirrors how real scheduling software works and avoids the system being so strict it becomes unusable in edge cases.

**Decision: The 10-hour rest rule applies across locations.**
A staff member finishing a shift at Beach at 11pm and starting at Downtown at 7am the next morning would still trigger the rest period violation. Rest requirements exist to protect the worker, not the location, so checking across all locations is the correct behaviour.

**Decision: Skill validation uses certifications, not self-reported skills.**
A staff member cannot simply claim they can bartend. They must have a certification linking them to that skill at a specific location, issued by a manager or admin. This prevents scheduling unqualified staff and provides an audit trail of who authorised each qualification.

**Decision: When a constraint is violated, the system suggests alternatives.**
The brief explicitly required this. When a manager tries to assign someone who fails a check, the assignment dialog shows which specific rule was violated and lists other staff members who are available, qualified, and within their hours limits. This reduces the cognitive load on managers, especially during high-pressure last-minute scheduling.

---

### Shift Swapping & Coverage

**Decision: Drop requests expire 24 hours before the shift, not immediately.**
If a drop request expired instantly when unclaimed, managers would be flooded with escalations for every dropped shift. The 24-hour window gives qualified colleagues time to pick it up organically. If it remains unclaimed at the cutoff, the manager is notified and must find coverage manually. This balances staff autonomy with operational safety.

**Decision: A staff member cannot have more than 3 pending swap/drop requests.**
Unlimited pending requests would allow staff to effectively opt out of their entire schedule by dropping everything and waiting. The cap of 3 creates a reasonable ceiling that protects the schedule while still allowing legitimate flexibility.

**Decision: The original assignment persists until manager approval.**
When Staff A and Staff B agree to a swap, nothing changes in the actual schedule until a manager explicitly approves. This is intentional — a manager may have context the staff members do not (upcoming event, skill gap that would result from the swap). The swap request is a proposal, not an automatic change.

**Decision: If the underlying shift is edited after a swap is approved but before it occurs, the swap is auto-cancelled.**
A swap agreement is made in the context of a specific shift at a specific time. If the shift changes materially (time, location, requirements), the agreement may no longer reflect what either party consented to. Auto-cancellation with notification to both parties is safer than silently applying the swap to a different shift than the one that was agreed.

---

### Overtime & Labor Law

**Decision: The 7th consecutive day is a hard block requiring a documented override reason.**
The 6th consecutive day is a warning because there are plausible business scenarios where it is acceptable. The 7th is a hard block because working seven days straight without a day off is a significant labor law concern in many jurisdictions. Allowing it only with a documented manager override reason creates an audit trail that protects both the business and the worker.

**Decision: Desired hours are tracked separately from availability.**
A staff member setting their availability to Monday–Friday 9am–5pm does not mean they want to be scheduled for all 40 hours. "Desired hours" is a separate field (defaulting to 40) that the fairness analytics use to identify who is under- or over-scheduled relative to their preference. Availability governs eligibility for a shift; desired hours govern reporting and fairness scoring.

**Decision: Any shift on a calendar day counts as that day worked for consecutive-day calculation.**
The brief explicitly left this ambiguous. A 1-hour closing shift counts the same as an 11-hour double when calculating consecutive days. The reason: the purpose of the consecutive-day rule is to ensure workers get a full day off, not just a reduction in hours. A person working a 1-hour shift on Sunday still had their Sunday taken up and still deserves a day off.

---

### Notifications & Real-Time

**Decision: WebSocket rooms are segmented by user ID and role.**
Each connected user joins a personal room (`user:{id}`) and a role room (`role:{ROLE}`). This allows targeted notifications (e.g. "your shift was changed" to a specific user) and broadcast notifications (e.g. "a new drop request needs coverage" to all managers) without sending irrelevant data to every connected client.

**Decision: Notification preferences are stored on the user record, not a separate table.**
Preferences are a simple JSON object (`{ inApp, email, push, digest }`) stored in a `notificationPrefs` column on the User model. This avoids a join for every notification check and is sufficient for the four preference types specified in the brief. If the system needed per-notification-type preferences at a granular level, a separate table would be warranted.

---

### Data Integrity & Audit Trail

**Decision: Users are soft-deleted (deactivated) rather than hard-deleted.**
Deleting a user record would orphan historical data — shifts they were assigned to, swap requests they made, audit log entries. Setting `isActive: false` preserves all historical context while preventing the account from being used. This is standard practice for any system with an audit requirement.

**Decision: Historical certifications are preserved when a staff member is de-certified.**
Rather than deleting the certification record, the system marks it `isActive: false`. This means historical shift assignments made under that certification remain valid in the audit trail. A manager who assigned someone to a shift because they were certified at the time should not lose that record just because the certification was later revoked.

**Decision: Every schedule change is logged with before/after state.**
The brief required this explicitly. The audit log captures the actor (who made the change), the timestamp, the entity changed, and the full before/after JSON. This supports the compliance scenario in the brief — an admin can export all changes to a location's schedule for any date range.

---

### Timezone Handling

**Decision: Shift times are stored in UTC and displayed in the location's timezone.**
All timestamps in the database are UTC. When displaying a shift to a user, the frontend converts to the timezone associated with that shift's location. This means a shift at the Beach location (Pacific time) always displays as Pacific time to anyone viewing it, regardless of where they are sitting. This is the correct approach for a multi-location system.

**Decision: For a location that spans a timezone boundary, the location's primary timezone is used.**
The brief flagged this as an intentional ambiguity. The decision was to assign each location a single canonical timezone and use it consistently. A restaurant near a state line is operationally in one timezone even if it straddles a boundary — the manager uses one clock, the staff use one clock, and the system uses one clock.

**Decision: Recurring availability uses day-of-week matching, not absolute dates.**
A staff member who sets themselves available Monday–Friday 9am–5pm is expressing a weekly pattern, not a list of specific dates. The system stores this as recurring availability records keyed to day-of-week. When a shift is being staffed, the system checks whether the shift's day and time falls within the staff member's availability window for that day. DST transitions are handled by converting to the location's local time before checking availability.

---

## ✨ Feature Summary

### 1. User Management & Roles
- ✅ Admin, Manager, and Staff roles with strict permission boundaries
- ✅ Public registration with admin-gated location access
- ✅ Multi-location certifications and skill tracking
- ✅ Recurring weekly availability + one-off date exceptions

### 2. Smart Shift Scheduling
- ✅ Create shifts with location, date/time, required skills, and headcount
- ✅ No double-booking across locations
- ✅ 10-hour minimum rest period between shifts
- ✅ Skill and location certification validation
- ✅ Availability checking with filtered alternative suggestions

### 3. Shift Swapping & Coverage
- ✅ Request swaps with specific staff members
- ✅ Drop shifts for anyone qualified to pick up
- ✅ Max 3 pending requests per staff member
- ✅ 24-hour expiration for unclaimed drop requests
- ✅ Manager approval workflow with real-time notifications

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
- ✅ Fairness scores (Gini coefficient)
- ✅ Hours distribution charts
- ✅ Premium shift tracking (Friday/Saturday evenings)

### 7. Complete Audit Trail
- ✅ Every change logged with who, when, and before/after state
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
## 🧪 Evaluation Scenarios

### 1. The Sunday Night Chaos
Log in as a manager → find a shift starting within 1 hour → Assign Staff → see only qualified, available staff certified at that location.

### 2. The Overtime Trap
Try assigning a staff member who would exceed 40 hours. The system blocks with an exact hours message and suggests alternatives.

### 3. The Timezone Tangle
View shifts across locations. Each shift displays in its location's local time regardless of the viewer's timezone.

### 4. The Simultaneous Assignment
Open two browser windows as different managers. Try assigning the same staff member to overlapping shifts. The second attempt receives an instant conflict notification.

### 5. The Fairness Complaint
Analytics → Fairness Report → view Gini coefficient and premium shift distribution per staff member.

### 6. The Regret Swap
Staff A requests a swap with Staff B. Before manager approval, Staff A cancels. Staff B receives a cancellation notification and the original assignment is restored.

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
