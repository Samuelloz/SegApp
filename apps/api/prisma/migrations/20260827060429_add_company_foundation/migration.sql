BEGIN;

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "slug" TEXT NOT NULL,
    "rfc" TEXT,
    "address" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/Mexico_City',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(6),

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- Create the initial company for existing data
INSERT INTO "Company" (
    "id",
    "name",
    "slug",
    "timezone",
    "active",
    "createdAt",
    "updatedAt"
)
VALUES (
    'company_lozcorp',
    'LozCorp',
    'lozcorp',
    'America/Mexico_City',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Add companyId as nullable while existing data is migrated
ALTER TABLE "Contract"
ADD COLUMN "companyId" TEXT;

ALTER TABLE "Guard"
ADD COLUMN "companyId" TEXT;

ALTER TABLE "GuardAssignment"
ADD COLUMN "companyId" TEXT;

-- Assign existing contracts and guards to the initial company
UPDATE "Contract"
SET "companyId" = 'company_lozcorp';

UPDATE "Guard"
SET "companyId" = 'company_lozcorp';

-- Derive each historical assignment's company from its guard
UPDATE "GuardAssignment" AS assignment
SET "companyId" = guard."companyId"
FROM "Guard" AS guard
WHERE assignment."guardId" = guard."id";

-- companyId becomes required after all rows have been migrated
ALTER TABLE "Contract"
ALTER COLUMN "companyId" SET NOT NULL;

ALTER TABLE "Guard"
ALTER COLUMN "companyId" SET NOT NULL;

ALTER TABLE "GuardAssignment"
ALTER COLUMN "companyId" SET NOT NULL;

-- Employee numbers are now unique inside each company,
-- rather than globally unique across the complete platform
DROP INDEX "Guard_employeeNumber_key";

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key"
ON "Company"("slug");

CREATE UNIQUE INDEX "Company_rfc_key"
ON "Company"("rfc");

CREATE INDEX "Contract_companyId_idx"
ON "Contract"("companyId");

CREATE UNIQUE INDEX "Guard_companyId_employeeNumber_key"
ON "Guard"("companyId", "employeeNumber");

CREATE INDEX "GuardAssignment_companyId_idx"
ON "GuardAssignment"("companyId");

-- AddForeignKey
ALTER TABLE "Contract"
ADD CONSTRAINT "Contract_companyId_fkey"
FOREIGN KEY ("companyId")
REFERENCES "Company"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "Guard"
ADD CONSTRAINT "Guard_companyId_fkey"
FOREIGN KEY ("companyId")
REFERENCES "Company"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "GuardAssignment"
ADD CONSTRAINT "GuardAssignment_companyId_fkey"
FOREIGN KEY ("companyId")
REFERENCES "Company"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

COMMIT;