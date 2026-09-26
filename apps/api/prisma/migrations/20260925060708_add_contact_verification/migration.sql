-- CreateTable
CREATE TABLE "ContactVerification" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "deliveryChannel" "InvitationDeliveryChannel" NOT NULL,
    "contactValue" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContactVerification_tokenHash_key" ON "ContactVerification"("tokenHash");

-- CreateIndex
CREATE INDEX "ContactVerification_userId_deliveryChannel_idx" ON "ContactVerification"("userId", "deliveryChannel");

-- CreateIndex
CREATE INDEX "ContactVerification_expiresAt_idx" ON "ContactVerification"("expiresAt");

-- AddForeignKey
ALTER TABLE "ContactVerification" ADD CONSTRAINT "ContactVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
