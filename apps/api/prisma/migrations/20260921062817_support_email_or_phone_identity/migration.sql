-- Allow either contact method while preserving existing email addresses.
ALTER TABLE "Invitation"
  ADD COLUMN "phoneE164" TEXT,
  ALTER COLUMN "email" DROP NOT NULL;

ALTER TABLE "User"
  ADD COLUMN "phoneE164" TEXT,
  ADD COLUMN "phoneVerifiedAt" TIMESTAMP(3),
  ALTER COLUMN "email" DROP NOT NULL;

CREATE INDEX "Invitation_companyId_phoneE164_idx"
  ON "Invitation"("companyId", "phoneE164");

CREATE UNIQUE INDEX "User_phoneE164_key" ON "User"("phoneE164");

ALTER TABLE "Invitation"
  ADD CONSTRAINT "Invitation_contact_required_check"
    CHECK ("email" IS NOT NULL OR "phoneE164" IS NOT NULL),
  ADD CONSTRAINT "Invitation_email_not_blank_check"
    CHECK ("email" IS NULL OR btrim("email") <> ''),
  ADD CONSTRAINT "Invitation_phone_e164_check"
    CHECK ("phoneE164" IS NULL OR "phoneE164" ~ '^[+][1-9][0-9]{1,14}$');

ALTER TABLE "User"
  ADD CONSTRAINT "User_contact_required_check"
    CHECK ("email" IS NOT NULL OR "phoneE164" IS NOT NULL),
  ADD CONSTRAINT "User_email_not_blank_check"
    CHECK ("email" IS NULL OR btrim("email") <> ''),
  ADD CONSTRAINT "User_phone_e164_check"
    CHECK ("phoneE164" IS NULL OR "phoneE164" ~ '^[+][1-9][0-9]{1,14}$'),
  ADD CONSTRAINT "User_email_verified_requires_email_check"
    CHECK ("emailVerifiedAt" IS NULL OR "email" IS NOT NULL),
  ADD CONSTRAINT "User_phone_verified_requires_phone_check"
    CHECK ("phoneVerifiedAt" IS NULL OR "phoneE164" IS NOT NULL);
