import { z } from 'zod';

import { userResponseSchema } from './auth';
import { companyMembershipResponseSchema } from './membership';

export const currentSessionResponseSchema = z.object({
  user: userResponseSchema,
  membership: companyMembershipResponseSchema,
  expiresAt: z.iso.datetime(),
});

export type CurrentSessionResponse = z.infer<
  typeof currentSessionResponseSchema
>;
