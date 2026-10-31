-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "teamId" TEXT;

-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "sessionId" TEXT;

-- AlterTable
ALTER TABLE "CourseSession" ADD COLUMN     "badgeCode" TEXT,
ADD COLUMN     "instructorId" TEXT,
ADD COLUMN     "topics" TEXT;

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "city" TEXT,
ADD COLUMN     "department" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "teamId" TEXT;

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "focusArea" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");

-- CreateIndex
CREATE INDEX "Appointment_teamId_idx" ON "Appointment"("teamId");

-- CreateIndex
CREATE INDEX "Assignment_sessionId_idx" ON "Assignment"("sessionId");

-- CreateIndex
CREATE INDEX "CourseSession_instructorId_idx" ON "CourseSession"("instructorId");

-- CreateIndex
CREATE INDEX "User_teamId_idx" ON "User"("teamId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseSession" ADD CONSTRAINT "CourseSession_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CourseSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Supabase exposes the public schema via its REST API; RLS without policies keeps anon out (the app owns the tables).
ALTER TABLE "Team" ENABLE ROW LEVEL SECURITY;
