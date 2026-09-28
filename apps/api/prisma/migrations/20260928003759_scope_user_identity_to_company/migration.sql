-- DropForeignKey
ALTER TABLE "CompanyMembership" DROP CONSTRAINT "CompanyMembership_userId_fkey";

-- DropIndex
DROP INDEX "User_email_key";

-- DropIndex
DROP INDEX "User_phoneE164_key";

-- Agregar como opcional para poder llenar las filas existentes
ALTER TABLE "User" ADD COLUMN "companyId" TEXT;

-- La empresa de cada cuenta es la de su membresia
UPDATE "User" u
SET "companyId" = m."companyId"
FROM "CompanyMembership" m
WHERE m."userId" = u."id";

-- Una cuenta sin membresia no tiene empresa: fallar en vez de inventarla.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "User" WHERE "companyId" IS NULL) THEN
       RAISE EXCEPTION 'Hay usuarios sin membresía; asigna o elimina esas cuentas antes de migrar.';
    END IF;
END $$;

ALTER TABLE "User" ALTER COLUMN "companyId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "CompanyMembership_userId_companyId_key" ON "CompanyMembership"("userId", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "User_companyId_email_key" ON "User"("companyId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "User_companyId_phoneE164_key" ON "User"("companyId", "phoneE164");

-- CreateIndex
CREATE UNIQUE INDEX "User_id_companyId_key" ON "User"("id", "companyId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyMembership" ADD CONSTRAINT "CompanyMembership_userId_companyId_fkey" FOREIGN KEY ("userId", "companyId") REFERENCES "User"("id", "companyId") ON DELETE RESTRICT ON UPDATE RESTRICT ;
