-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'STAFF');

-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SwapRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SwapRequestType" AS ENUM ('SWAP', 'DROP');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SHIFT_ASSIGNED', 'SHIFT_CHANGED', 'SHIFT_CANCELLED', 'SHIFT_PUBLISHED', 'SWAP_REQUESTED', 'SWAP_ACCEPTED', 'SWAP_DECLINED', 'SWAP_APPROVED', 'SWAP_REJECTED', 'DROP_REQUESTED', 'DROP_ACCEPTED', 'OVERTIME_WARNING', 'CONSECUTIVE_DAY_WARNING', 'SCHEDULE_PUBLISHED', 'AVAILABILITY_CHANGED', 'CERTIFICATION_EXPIRING', 'LOCATION_TRANSFER');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'ASSIGN', 'UNSIGN', 'APPROVE', 'REJECT', 'PUBLISH', 'UNPUBLISH', 'LOGIN', 'LOGOUT', 'EXPORT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "phone" TEXT,
    "avatar" TEXT,
    "notificationPrefs" JSONB NOT NULL DEFAULT '{"inApp": true, "email": false, "push": false}',
    "desiredHours" INTEGER DEFAULT 40,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'USA',
    "timezone" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "certifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "certifiedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Availability" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dayOfWeek" INTEGER,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT true,
    "exceptionDate" TIMESTAMP(3),
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "ShiftStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "publishedBy" TEXT,
    "cutoffHours" INTEGER NOT NULL DEFAULT 48,
    "metadata" JSONB,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftRequirement" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "headcount" INTEGER NOT NULL DEFAULT 1,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShiftRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftAssignment" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "clockedInAt" TIMESTAMP(3),
    "clockedOutAt" TIMESTAMP(3),
    "actualHours" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShiftAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SwapRequest" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "responderId" TEXT,
    "status" "SwapRequestStatus" NOT NULL DEFAULT 'PENDING',
    "type" "SwapRequestType" NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SwapRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "beforeState" JSONB,
    "afterState" JSONB,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "location" TEXT,
    "shiftId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OvertimeWarning" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "totalHours" DOUBLE PRECISION NOT NULL,
    "warningType" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OvertimeWarning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ManagerLocations" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ManagerLocations_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Location_name_key" ON "Location"("name");

-- CreateIndex
CREATE INDEX "Location_timezone_idx" ON "Location"("timezone");

-- CreateIndex
CREATE INDEX "Location_isActive_idx" ON "Location"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Location_name_city_key" ON "Location"("name", "city");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");

-- CreateIndex
CREATE INDEX "Skill_category_idx" ON "Skill"("category");

-- CreateIndex
CREATE INDEX "Skill_isActive_idx" ON "Skill"("isActive");

-- CreateIndex
CREATE INDEX "Certification_userId_idx" ON "Certification"("userId");

-- CreateIndex
CREATE INDEX "Certification_locationId_idx" ON "Certification"("locationId");

-- CreateIndex
CREATE INDEX "Certification_skillId_idx" ON "Certification"("skillId");

-- CreateIndex
CREATE INDEX "Certification_expiresAt_idx" ON "Certification"("expiresAt");

-- CreateIndex
CREATE INDEX "Certification_isActive_idx" ON "Certification"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Certification_userId_locationId_skillId_key" ON "Certification"("userId", "locationId", "skillId");

-- CreateIndex
CREATE INDEX "Availability_userId_idx" ON "Availability"("userId");

-- CreateIndex
CREATE INDEX "Availability_dayOfWeek_idx" ON "Availability"("dayOfWeek");

-- CreateIndex
CREATE INDEX "Availability_exceptionDate_idx" ON "Availability"("exceptionDate");

-- CreateIndex
CREATE UNIQUE INDEX "Availability_userId_exceptionDate_key" ON "Availability"("userId", "exceptionDate");

-- CreateIndex
CREATE INDEX "Shift_locationId_idx" ON "Shift"("locationId");

-- CreateIndex
CREATE INDEX "Shift_startTime_idx" ON "Shift"("startTime");

-- CreateIndex
CREATE INDEX "Shift_status_idx" ON "Shift"("status");

-- CreateIndex
CREATE INDEX "Shift_locationId_startTime_idx" ON "Shift"("locationId", "startTime");

-- CreateIndex
CREATE INDEX "Shift_locationId_status_idx" ON "Shift"("locationId", "status");

-- CreateIndex
CREATE INDEX "ShiftRequirement_shiftId_idx" ON "ShiftRequirement"("shiftId");

-- CreateIndex
CREATE INDEX "ShiftRequirement_skillId_idx" ON "ShiftRequirement"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "ShiftRequirement_shiftId_skillId_key" ON "ShiftRequirement"("shiftId", "skillId");

-- CreateIndex
CREATE INDEX "ShiftAssignment_userId_idx" ON "ShiftAssignment"("userId");

-- CreateIndex
CREATE INDEX "ShiftAssignment_shiftId_idx" ON "ShiftAssignment"("shiftId");

-- CreateIndex
CREATE INDEX "ShiftAssignment_clockedInAt_idx" ON "ShiftAssignment"("clockedInAt");

-- CreateIndex
CREATE INDEX "ShiftAssignment_clockedOutAt_idx" ON "ShiftAssignment"("clockedOutAt");

-- CreateIndex
CREATE UNIQUE INDEX "ShiftAssignment_shiftId_userId_key" ON "ShiftAssignment"("shiftId", "userId");

-- CreateIndex
CREATE INDEX "SwapRequest_status_idx" ON "SwapRequest"("status");

-- CreateIndex
CREATE INDEX "SwapRequest_expiresAt_idx" ON "SwapRequest"("expiresAt");

-- CreateIndex
CREATE INDEX "SwapRequest_requesterId_idx" ON "SwapRequest"("requesterId");

-- CreateIndex
CREATE INDEX "SwapRequest_responderId_idx" ON "SwapRequest"("responderId");

-- CreateIndex
CREATE INDEX "SwapRequest_shiftId_idx" ON "SwapRequest"("shiftId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_priority_createdAt_idx" ON "Notification"("priority", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_isRead_createdAt_idx" ON "Notification"("isRead", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_createdAt_idx" ON "AuditLog"("entityType", "createdAt");

-- CreateIndex
CREATE INDEX "OvertimeWarning_userId_idx" ON "OvertimeWarning"("userId");

-- CreateIndex
CREATE INDEX "OvertimeWarning_weekStart_idx" ON "OvertimeWarning"("weekStart");

-- CreateIndex
CREATE INDEX "OvertimeWarning_warningType_idx" ON "OvertimeWarning"("warningType");

-- CreateIndex
CREATE INDEX "OvertimeWarning_acknowledgedAt_idx" ON "OvertimeWarning"("acknowledgedAt");

-- CreateIndex
CREATE UNIQUE INDEX "OvertimeWarning_userId_weekStart_warningType_key" ON "OvertimeWarning"("userId", "weekStart", "warningType");

-- CreateIndex
CREATE INDEX "_ManagerLocations_B_index" ON "_ManagerLocations"("B");

-- AddForeignKey
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftRequirement" ADD CONSTRAINT "ShiftRequirement_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftRequirement" ADD CONSTRAINT "ShiftRequirement_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftAssignment" ADD CONSTRAINT "ShiftAssignment_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftAssignment" ADD CONSTRAINT "ShiftAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftAssignment" ADD CONSTRAINT "ShiftAssignment_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "ShiftRequirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SwapRequest" ADD CONSTRAINT "SwapRequest_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SwapRequest" ADD CONSTRAINT "SwapRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SwapRequest" ADD CONSTRAINT "SwapRequest_responderId_fkey" FOREIGN KEY ("responderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OvertimeWarning" ADD CONSTRAINT "OvertimeWarning_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ManagerLocations" ADD CONSTRAINT "_ManagerLocations_A_fkey" FOREIGN KEY ("A") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ManagerLocations" ADD CONSTRAINT "_ManagerLocations_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
