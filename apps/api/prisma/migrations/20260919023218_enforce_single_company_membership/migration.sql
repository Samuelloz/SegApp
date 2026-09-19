/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `CompanyMembership` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "CompanyMembership_companyId_userId_key";

-- DropIndex
DROP INDEX "CompanyMembership_userId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "CompanyMembership_userId_key" ON "CompanyMembership"("userId");
