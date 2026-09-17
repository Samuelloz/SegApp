/*
  Warnings:

  - Added the required column `clientRfc` to the `Contract` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Contract_companyId_idx";

-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "clientRfc" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Contract_companyId_clientRfc_idx" ON "Contract"("companyId", "clientRfc");
