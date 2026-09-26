import { z } from 'zod';

import { contactVerificationTokenSchema } from './auth';
import { invitationDeliveryChannelSchema } from './membership';

export const verifyContactSchema = z.object({
  token: contactVerificationTokenSchema,
});

export const verifyContactResponseSchema = z.object({
  membershipId: z.string(),
  companyName: z.string(),
  status: z.literal('ACTIVE'),
  deliveryChannel: invitationDeliveryChannelSchema,
});

export type VerifyContactInput = z.infer<typeof verifyContactSchema>;
export type VerifyContactResponse = z.infer<typeof verifyContactResponseSchema>;
