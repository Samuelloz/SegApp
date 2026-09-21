import { z } from 'zod';

import { userEmailSchema } from './auth';
import { companyResponseSchema } from './company';

export const membershipRoleSchema = z.enum([
  'OWNER',
  'ADMIN',
  'SALES',
  'CONTRACT_MANAGER',
  'GUARD_MANAGER',
  'SUPERVISOR',
  'VIEWER',
]);

export const membershipStatusSchema = z.enum(['ACTIVE', 'SUSPENDED']);

const invitableMembershipRoleSchema = z.enum([
  'ADMIN',
  'SALES',
  'CONTRACT_MANAGER',
  'GUARD_MANAGER',
  'SUPERVISOR',
  'VIEWER',
]);

const membershipRolesSchema = z
  .array(membershipRoleSchema)
  .min(1, 'Debe seleccionar al menos un rol.')
  .refine((roles) => new Set(roles).size === roles.length, {
    message: 'Los roles no pueden repetirse.',
  });

const invitableMembershipRolesSchema = z
  .array(invitableMembershipRoleSchema)
  .min(1, 'Debe seleccionar al menos un rol.')
  .refine((roles) => new Set(roles).size === roles.length, {
    message: 'Los roles no pueden repetirse.',
  });

const membershipCompanyResponseSchema = companyResponseSchema.pick({
  id: true,
  name: true,
  slug: true,
});

export const createInvitationSchema = z.object({
  email: userEmailSchema,
  roles: invitableMembershipRolesSchema,
});

export const companyMembershipResponseSchema = z.object({
  id: z.string(),
  roles: membershipRolesSchema,
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
