-- PostgreSQL enforces one pending invitation per company and contact even
-- when concurrent requests pass the application's duplicate check.
-- Expired pending invitations are revoked by the service before a replacement
-- is created, because time-dependent conditions cannot be used in this index.
CREATE UNIQUE INDEX "Invitation_pending_company_email_key"
  ON "Invitation"("companyId", "email")
  WHERE "email" IS NOT NULL
    AND "acceptedAt" IS NULL
    AND "revokedAt" IS NULL;

CREATE UNIQUE INDEX "Invitation_pending_company_phone_key"
  ON "Invitation"("companyId", "phoneE164")
  WHERE "phoneE164" IS NOT NULL
    AND "acceptedAt" IS NULL
    AND "revokedAt" IS NULL;
