-- CreateTable
CREATE TABLE "GuardAssignment" (
    "id" TEXT NOT NULL,
    "guardId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuardAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GuardAssignment_guardId_idx" ON "GuardAssignment"("guardId");

-- CreateIndex
CREATE INDEX "GuardAssignment_contractId_idx" ON "GuardAssignment"("contractId");

-- CreateIndex
CREATE INDEX "GuardAssignment_endedAt_idx" ON "GuardAssignment"("endedAt");

-- AddForeignKey
ALTER TABLE "GuardAssignment" ADD CONSTRAINT "GuardAssignment_guardId_fkey" FOREIGN KEY ("guardId") REFERENCES "Guard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardAssignment" ADD CONSTRAINT "GuardAssignment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
