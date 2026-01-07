-- CreateEnum
CREATE TYPE "WorkSetup" AS ENUM ('Onsite', 'Hybrid', 'Remote');

-- CreateEnum
CREATE TYPE "AppStatus" AS ENUM ('applied', 'screening', 'interview', 'technical_test', 'offer', 'rejected', 'ghosting', 'hired', 'withdrawn');

-- CreateEnum
CREATE TYPE "InterviewType" AS ENUM ('hr', 'user', 'technical', 'cultural', 'other');

-- CreateEnum
CREATE TYPE "TestType" AS ENUM ('live_code', 'take_home', 'offline', 'psychotest', 'other');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('interview_hr', 'interview_user', 'technical_test', 'psychotest', 'offer', 'follow_up', 'other');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('online', 'offline');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "headline" TEXT,
    "location" TEXT,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "workSetup" "WorkSetup" NOT NULL,
    "status" "AppStatus" NOT NULL,
    "statusDetail" TEXT,
    "source" TEXT,
    "jobLink" TEXT,
    "notes" TEXT,
    "requiredSkills" TEXT[],
    "niceToHave" TEXT[],
    "appliedAt" TIMESTAMP(3) NOT NULL,
    "lastUpdate" TIMESTAMP(3) NOT NULL,
    "nextEventAt" TIMESTAMP(3),
    "nextEventTitle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationTimelineEvent" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "stage" "AppStatus" NOT NULL,
    "detail" TEXT,
    "mode" "LocationType",
    "meetLink" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "at" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationTimelineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "applicationId" TEXT,
    "title" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "company" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "locationType" "LocationType",
    "meetLink" TEXT,
    "place" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE INDEX "Application_userId_idx" ON "Application"("userId");

-- CreateIndex
CREATE INDEX "Application_status_idx" ON "Application"("status");

-- CreateIndex
CREATE INDEX "Application_nextEventAt_idx" ON "Application"("nextEventAt");

-- CreateIndex
CREATE INDEX "ApplicationTimelineEvent_applicationId_idx" ON "ApplicationTimelineEvent"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationTimelineEvent_at_idx" ON "ApplicationTimelineEvent"("at");

-- CreateIndex
CREATE INDEX "CalendarEvent_userId_idx" ON "CalendarEvent"("userId");

-- CreateIndex
CREATE INDEX "CalendarEvent_startAt_idx" ON "CalendarEvent"("startAt");

-- CreateIndex
CREATE INDEX "CalendarEvent_applicationId_idx" ON "CalendarEvent"("applicationId");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationTimelineEvent" ADD CONSTRAINT "ApplicationTimelineEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;
