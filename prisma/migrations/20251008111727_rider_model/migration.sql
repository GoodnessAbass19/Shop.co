/*
  Warnings:

  - You are about to drop the column `name` on the `Rider` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Rider` table. All the data in the column will be lost.
  - You are about to drop the column `isBuyer` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `Rider` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phoneNumber]` on the table `Rider` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nin]` on the table `Rider` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[bvn]` on the table `Rider` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[plateNumber]` on the table `Rider` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `accountName` to the `Rider` table without a default value. This is not possible if the table is not empty.
  - Added the required column `accountNumber` to the `Rider` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bankName` to the `Rider` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dateOfBirth` to the `Rider` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `Rider` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `Rider` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gender` to the `Rider` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guarantor1Name` to the `Rider` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guarantor1Phone` to the `Rider` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guarantor1Relationship` to the `Rider` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guarantor2Name` to the `Rider` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guarantor2Phone` to the `Rider` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guarantor2Relationship` to the `Rider` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `Rider` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nextOfKinName` to the `Rider` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nextOfKinPhone` to the `Rider` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nin` to the `Rider` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phoneNumber` to the `Rider` table without a default value. This is not possible if the table is not empty.
  - Added the required column `plateNumber` to the `Rider` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stateOfResidence` to the `Rider` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vehicleColor` to the `Rider` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vehicleModel` to the `Rider` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vehicleType` to the `Rider` table without a default value. This is not possible if the table is not empty.
  - Made the column `userId` on table `Rider` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('MOTORCYCLE', 'BICYCLE', 'CAR', 'VAN', 'SCOOTER');

-- CreateEnum
CREATE TYPE "GuarantorRelationship" AS ENUM ('FATHER', 'MOTHER', 'BROTHER', 'SISTER', 'SPOUSE', 'UNCLE', 'AUNTY');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "RiderStatus" AS ENUM ('PENDING_APPROVAL', 'VERIFIED', 'ACTIVE', 'DELIVERING', 'UNAVAILABLE', 'SUSPENDED');

-- DropForeignKey
ALTER TABLE "Rider" DROP CONSTRAINT "Rider_userId_fkey";

-- DropIndex
DROP INDEX "Rider_phone_key";

-- AlterTable
ALTER TABLE "Rider" DROP COLUMN "name",
DROP COLUMN "phone",
ADD COLUMN     "accountName" TEXT NOT NULL,
ADD COLUMN     "accountNumber" TEXT NOT NULL,
ADD COLUMN     "bankName" TEXT NOT NULL,
ADD COLUMN     "bvn" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "gender" "Gender" NOT NULL,
ADD COLUMN     "guarantor1Name" TEXT NOT NULL,
ADD COLUMN     "guarantor1Phone" TEXT NOT NULL,
ADD COLUMN     "guarantor1Relationship" "GuarantorRelationship" NOT NULL,
ADD COLUMN     "guarantor2Name" TEXT NOT NULL,
ADD COLUMN     "guarantor2Phone" TEXT NOT NULL,
ADD COLUMN     "guarantor2Relationship" "GuarantorRelationship" NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "nextOfKinName" TEXT NOT NULL,
ADD COLUMN     "nextOfKinPhone" TEXT NOT NULL,
ADD COLUMN     "nin" TEXT NOT NULL,
ADD COLUMN     "ninImage" TEXT,
ADD COLUMN     "phoneNumber" TEXT NOT NULL,
ADD COLUMN     "plateNumber" TEXT NOT NULL,
ADD COLUMN     "profileImage" TEXT,
ADD COLUMN     "stateOfResidence" TEXT NOT NULL,
ADD COLUMN     "status" "RiderStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
ADD COLUMN     "vehicleColor" TEXT NOT NULL,
ADD COLUMN     "vehicleModel" TEXT NOT NULL,
ADD COLUMN     "vehicleRegistrationDocument" TEXT,
ADD COLUMN     "vehicleType" "VehicleType" NOT NULL,
ALTER COLUMN "isActive" SET DEFAULT false,
ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "isBuyer";

-- CreateIndex
CREATE UNIQUE INDEX "Rider_email_key" ON "Rider"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Rider_phoneNumber_key" ON "Rider"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Rider_nin_key" ON "Rider"("nin");

-- CreateIndex
CREATE UNIQUE INDEX "Rider_bvn_key" ON "Rider"("bvn");

-- CreateIndex
CREATE UNIQUE INDEX "Rider_plateNumber_key" ON "Rider"("plateNumber");

-- AddForeignKey
ALTER TABLE "Rider" ADD CONSTRAINT "Rider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
