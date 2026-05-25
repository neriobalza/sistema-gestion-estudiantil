/*
  Warnings:

  - You are about to drop the column `facultyId` on the `Career` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VerificationToken` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[schoolId,code]` on the table `Career` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[facultyId,code]` on the table `Classroom` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `schoolId` to the `Career` table without a default value. This is not possible if the table is not empty.
  - Added the required column `facultyId` to the `Classroom` table without a default value. This is not possible if the table is not empty.
  - Added the required column `departmentId` to the `Subject` table without a default value. This is not possible if the table is not empty.
  - Made the column `passwordHash` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_userId_fkey";

-- DropForeignKey
ALTER TABLE "Career" DROP CONSTRAINT "Career_facultyId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- DropIndex
DROP INDEX "Career_facultyId_code_key";

-- DropIndex
DROP INDEX "Career_facultyId_idx";

-- DropIndex
DROP INDEX "Classroom_code_key";

-- AlterTable
ALTER TABLE "Career" DROP COLUMN "facultyId",
ADD COLUMN     "schoolId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Classroom" ADD COLUMN     "facultyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "EnrollmentPeriod" ADD COLUMN     "schoolId" TEXT;

-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "departmentId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "emailVerified",
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "passwordHash" SET NOT NULL;

-- DropTable
DROP TABLE "Account";

-- DropTable
DROP TABLE "Session";

-- DropTable
DROP TABLE "VerificationToken";

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "School_facultyId_idx" ON "School"("facultyId");

-- CreateIndex
CREATE UNIQUE INDEX "School_facultyId_code_key" ON "School"("facultyId", "code");

-- CreateIndex
CREATE INDEX "Career_schoolId_idx" ON "Career"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Career_schoolId_code_key" ON "Career"("schoolId", "code");

-- CreateIndex
CREATE INDEX "Classroom_facultyId_idx" ON "Classroom"("facultyId");

-- CreateIndex
CREATE UNIQUE INDEX "Classroom_facultyId_code_key" ON "Classroom"("facultyId", "code");

-- CreateIndex
CREATE INDEX "EnrollmentPeriod_schoolId_idx" ON "EnrollmentPeriod"("schoolId");

-- CreateIndex
CREATE INDEX "Subject_departmentId_idx" ON "Subject"("departmentId");

-- AddForeignKey
ALTER TABLE "School" ADD CONSTRAINT "School_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Career" ADD CONSTRAINT "Career_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentPeriod" ADD CONSTRAINT "EnrollmentPeriod_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Classroom" ADD CONSTRAINT "Classroom_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
