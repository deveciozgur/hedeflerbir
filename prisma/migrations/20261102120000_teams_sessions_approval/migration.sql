-- AlterEnum
ALTER TYPE "AppointmentStatus" ADD VALUE 'PENDING';

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "adminNotes" TEXT,
ADD COLUMN     "approvedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "school" TEXT;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "representativeId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "kvkkConsentAt" TIMESTAMP(3),
ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Team_representativeId_key" ON "Team"("representativeId");

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_representativeId_fkey" FOREIGN KEY ("representativeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

