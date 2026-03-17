Is this Readme okay
# 🏖️ ShiftSync - Multi-Location Staff Scheduling Platform

## 📋 **Overview**

ShiftSync is a comprehensive workforce scheduling platform built for **Coastal Eats**, a restaurant group operating **4 locations** across **2 time zones**. The platform solves real-world scheduling challenges including staff callouts, overtime costs, unfair shift distribution, and multi-location visibility.

### **Live Demo**
- **Frontend**: [https://shift-sync-git-main-drusilla-s-projects.vercel.app/](https://shift-sync-git-main-drusilla-s-projects.vercel.app/)
- **Backend API**: [https://shiftsync-backend.onrender.com/api](https://shiftsync-backend.onrender.com/api)

---

## 🔐 **Test Credentials**

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **Admin** | `admin@coastaleats.com` | `password123` | Full system access |
| **Manager (Downtown)** | `manager.downtown@coastaleats.com` | `password123` | Downtown location only |
| **Manager (Beach)** | `manager.beach@coastaleats.com` | `password123` | Beach location only |
| **Manager (Midtown)** | `manager.midtown@coastaleats.com` | `password123` | Midtown location only |
| **Staff** | `john.doe@coastaleats.com` | `password123` | Self-only access |
| **Staff** | `jane.smith@coastaleats.com` | `password123` | Self-only access |

---

## ✨ **Features**

### **1. User Management & Roles**
- ✅ **Admin**: Corporate oversight across all locations
- ✅ **Manager**: Runs one or more specific locations
- ✅ **Staff**: Works shifts at one or more locations
- ✅ Multi-location certifications and skills tracking
- ✅ Recurring availability + one-off exceptions

### **2. Smart Shift Scheduling**
- ✅ Create shifts with location, time, skills, and headcount
- ✅ **No double-booking** enforcement
- ✅ **10-hour minimum rest period** between shifts
- ✅ Skill and location certification validation
- ✅ Availability checking with **alternative suggestions**

### **3. Shift Swapping & Coverage**
- ✅ Request swaps with specific staff members
- ✅ Drop shifts for anyone qualified to pick up
- ✅ **Max 3 pending requests** per staff member
- ✅ 24-hour expiration for drop requests
- ✅ Manager approval workflow

### **4. Overtime & Labor Law Compliance**
| Rule | Warning | Hard Block |
|------|---------|------------|
| Weekly hours | 35+ hours | 40+ hours |
| Daily hours | 8+ hours | 12+ hours |
| Consecutive days | 6th day | 7th day |
| Rest period | N/A | <10 hours |

### **5. Real-Time Features**
- ✅ Live schedule updates without refreshing
- ✅ Instant notifications for swaps and approvals
- ✅ **"On-duty now"** dashboard
- ✅ Concurrent edit prevention

### **6. Analytics Dashboard**
- ✅ Overtime cost projections
- ✅ Fairness scores (Gini coefficient)
- ✅ Hours distribution charts
- ✅ Premium shift tracking

### **7. Complete Audit Trail**
- ✅ Every change logged (who, when, before/after)
- ✅ Exportable audit logs for compliance
- ✅ IP address and user agent tracking

---

## 🏗️ **Tech Stack**

### **Backend** (Modular Monolith)
- **Framework**: NestJS 11 with TypeScript
- **Database**: PostgreSQL 15 with Prisma ORM 7
- **Authentication**: JWT with refresh tokens
- **Real-time**: WebSocket (Socket.io)
- **Validation**: class-validator + class-transformer

### **Frontend** (Component-Based)
- **Framework**: Next.js 16 with TypeScript
- **Styling**: Tailwind CSS (dark green #2e6b3e / dark blue #0a2351)
- **State Management**: React Hooks + Context
- **Real-time**: Socket.io-client
- **Charts**: Chart.js + react-chartjs-2

### **DevOps**
- **Frontend Hosting**: Vercel
- **Backend Hosting**: Render
- **Database**: Render PostgreSQL
- **Version Control**: Git + GitHub

---

## 🚀 **Live URLs**

| Service | URL |
|---------|-----|
| **Frontend** | [https://shift-sync-git-main-drusilla-s-projects.vercel.app/](https://shift-sync-git-main-drusilla-s-projects.vercel.app/) |
| **Backend API** | [https://shiftsync-backend.onrender.com/api](https://shiftsync-backend.onrender.com/api) |
| **GitHub Repository** | [https://github.com/drusykhulwi/ShiftSync.git](https://github.com/drusykhulwi/ShiftSync.git) |

---

## 📁 **Project Structure**

```
shiftsync/
├── backend/                 # NestJS Backend
│   ├── src/
│   │   ├── modules/         # Feature modules
│   │   │   ├── auth/        # Authentication
│   │   │   ├── users/       # User management
│   │   │   ├── locations/   # Multi-location
│   │   │   ├── skills/      # Skills & certifications
│   │   │   ├── shifts/      # Core scheduling
│   │   │   ├── swap-requests/# Shift swapping
│   │   │   ├── overtime/    # Labor law compliance
│   │   │   ├── notifications/# Real-time alerts
│   │   │   └── audit/       # Audit trail
│   │   └── common/          # Shared utilities
│   └── prisma/              # Database schema
│
└── frontend/                # Next.js Frontend
    ├── src/
    │   ├── pages/           # Next.js pages
    │   ├── components/      # Reusable components
    │   ├── hooks/           # Custom React hooks
    │   ├── services/        # API services
    │   ├── types/           # TypeScript types
    │   └── styles/          # Global styles
    └── public/              # Static assets
```

---

## 🧪 **Testing the Application**

### **Try These Scenarios:**

#### **1. The Sunday Night Chaos**
- Log in as manager
- Click "Emergency Coverage" on a shift 1 hour away
- See system find qualified available staff

#### **2. The Overtime Trap**
- Try assigning an employee to 52 hours in a week
- System blocks with alternative suggestions

#### **3. The Timezone Tangle**
- Check shifts at different locations
- Times display correctly in each location's timezone

#### **4. The Simultaneous Assignment**
- Open two browser windows as different managers
- Try assigning the same staff member to overlapping shifts
- Second attempt gets instant conflict notification

#### **5. The Fairness Complaint**
- Run Fairness Report from analytics
- View Gini coefficient and premium shift distribution

#### **6. The Regret Swap**
- Staff A requests swap with Staff B
- Staff A cancels before manager approves
- Staff B gets cancellation notification

---

## 🛠️ **Local Development Setup**

### **Prerequisites**
- Node.js 18+
- Docker & Docker Compose (or PostgreSQL 15 locally)
- Git

### **Installation**

```bash
# 1. Clone the repository
git clone https://github.com/drusykhulwi/ShiftSync.git
cd ShiftSync

# 2. Set up backend
cd backend
cp .env.example .env
npm install
docker-compose up -d postgres  # Start PostgreSQL
npx prisma migrate dev --name init
npm run prisma:seed
npm run start:dev

# 3. Set up frontend (in new terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev

# 4. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:4000/api
```

### **Environment Variables**

**Backend** (`backend/.env`):
```env
DATABASE_URL="postgresql://shiftsync:shiftsync123@localhost:5432/shiftsync"
JWT_SECRET="your-super-secret-jwt-key"
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

## 📊 **API Documentation**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | User login |
| `POST` | `/api/auth/register` | New registration |
| `GET` | `/api/users/profile` | Current user profile |
| `GET` | `/api/users` | List users (filtered by role) |
| `POST` | `/api/shifts` | Create shift |
| `GET` | `/api/shifts` | List shifts |
| `POST` | `/api/shifts/:id/assign` | Assign staff |
| `POST` | `/api/swap-requests` | Create swap request |
| `GET` | `/api/overtime/warnings` | List overtime warnings |
| `GET` | `/api/audit` | View audit logs (admin only) |

---

## 🎯 **Evaluation Criteria Met**

| Criteria | Weight | Implementation |
|----------|--------|----------------|
| Constraint enforcement | 25% | ✅ All labor law rules enforced |
| Edge case handling | 20% | ✅ Overnight shifts, DST, concurrent edits |
| Real-time functionality | 15% | ✅ WebSocket for all updates |
| User experience & feedback | 15% | ✅ Clear errors with alternatives |
| Data integrity | 15% | ✅ Transactions + audit logs |
| Code organization | 10% | ✅ Modular monolith + component structure |

---

## 🤔 **Intentional Ambiguities - Our Decisions**

| Ambiguity | Our Approach |
|-----------|--------------|
| Historical data on de-certification | Keep certifications with `isActive=false` flag |
| Desired hours vs. availability | Availability takes precedence |
| 1-hour shift for consecutive days | Any shift counts as a day worked |
| Shift edited after swap approval | Auto-cancel swap request with notification |
| Location spanning timezone boundary | Use location's primary timezone |

---

