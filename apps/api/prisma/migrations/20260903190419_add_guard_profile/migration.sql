/*
  Warnings:

  - You are about to drop the column `fullname` on the `Guard` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[companyId,rfc]` on the table `Guard` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,curp]` on the table `Guard` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,nss]` on the table `Guard` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `birthDate` to the `Guard` table without a default value. This is not possible if the table is not empty.
  - Added the required column `birthPlace` to the `Guard` table without a default value. This is not possible if the table is not empty.
  - Added the required column `curp` to the `Guard` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fatherFullName` to the `Guard` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fullName` to the `Guard` table without a default value. This is not possible if the table is not empty.
  - Added the required column `motherFullName` to the `Guard` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nss` to the `Guard` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rfc` to the `Guard` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Guard" DROP COLUMN "fullname",
ADD COLUMN     "birthDate" DATE NOT NULL,
ADD COLUMN     "birthPlace" TEXT NOT NULL,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "curp" TEXT NOT NULL,
ADD COLUMN     "exteriorNumber" TEXT,
ADD COLUMN     "externalPlaceId" TEXT,
ADD COLUMN     "fatherFullName" TEXT NOT NULL,
ADD COLUMN     "formattedAddress" TEXT,
ADD COLUMN     "fullName" TEXT NOT NULL,
ADD COLUMN     "interiorNumber" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "motherFullName" TEXT NOT NULL,
ADD COLUMN     "municipality" TEXT,
ADD COLUMN     "neighborhood" TEXT,
ADD COLUMN     "nss" TEXT NOT NULL,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "rfc" TEXT NOT NULL,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "street" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Guard_companyId_rfc_key" ON "Guard"("companyId", "rfc");

-- CreateIndex
CREATE UNIQUE INDEX "Guard_companyId_curp_key" ON "Guard"("companyId", "curp");

-- CreateIndex
CREATE UNIQUE INDEX "Guard_companyId_nss_key" ON "Guard"("companyId", "nss");
