/*
  Warnings:

  - Added the required column `clientLegalName` to the `Contract` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contactName` to the `Contract` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contactPhone` to the `Contract` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requiredGuardCount` to the `Contract` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `Contract` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "city" TEXT,
ADD COLUMN     "clientLegalName" TEXT NOT NULL,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactName" TEXT NOT NULL,
ADD COLUMN     "contactPhone" TEXT NOT NULL,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "endDate" DATE,
ADD COLUMN     "exteriorNumber" TEXT,
ADD COLUMN     "externalPlaceId" TEXT,
ADD COLUMN     "formattedAddress" TEXT,
ADD COLUMN     "interiorNumber" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "municipality" TEXT,
ADD COLUMN     "neighborhood" TEXT,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "requiredGuardCount" INTEGER NOT NULL,
ADD COLUMN     "startDate" DATE NOT NULL,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "street" TEXT;
