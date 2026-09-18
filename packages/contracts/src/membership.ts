import { z } from 'zod';

import { userEmailSchema } from './auth';
import { companyResponseSchema } from './company';

export const membershipRoleSchema = z.enum([
  'OWNER',
  'ADMIN',
  'SUPERVISOR',
  'VIEWER',
]);

export const membershipStatusSchema = z.enum(['ACTIVE', 'SUSPENDED']);

const invitableMembershipRoleSchema = z.enum(['ADMIN', 'SUPERVISOR', 'VIEWER']);

const membershipCompanyResponseSchema = companyResponseSchema.pick({
  id: true,
  name: true,
  slug: true,
});

export const createInvitationSchema = z.object({
  email: userEmailSchema,
  role: invitableMembershipRoleSchema,
});

export const companyMembershipResponseSchema = z.object({
  id: z.string(),
  role: membershipRoleSchema,
  status: membershipStatusSchema,
  company: membershipCompanyResponseSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type MembershipRole = z.infer<typeof membershipRoleSchema>;
export type MembershipStatus = z.infer<typeof membershipStatusSchema>;
export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type CompanyMembershipResponse = z.infer<
  typeof companyMembershipResponseSchema
>;
