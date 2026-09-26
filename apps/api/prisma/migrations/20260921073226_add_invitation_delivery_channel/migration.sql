-- No invitation-creation endpoint exists yet. Add the required channel before
-- invitations are issued, without inventing a default delivery method.
CREATE TYPE "InvitationDeliveryChannel" AS ENUM ('EMAIL', 'WHATSAPP');

ALTER TABLE "Invitation"
  ADD COLUMN "deliveryChannel" "InvitationDeliveryChannel" NOT NULL;

ALTER TABLE "Invitation"
  ADD CONSTRAINT "Invitation_delivery_channel_contact_check"
    CHECK (
      ("deliveryChannel" = 'EMAIL' AND "email" IS NOT NULL)
      OR ("deliveryChannel" = 'WHATSAPP' AND "phoneE164" IS NOT NULL)
    );
