import { z } from 'zod';

import {
  contactVerificationTokenSchema,
  invitationTokenSchema,
  userEmailSchema,
  userPhoneE164Schema,
} from './auth';
import { companyResponseSchema } from './company';

export const invitationDeliveryChannelSchema = z.enum(['EMAIL', 'WHATSAPP']);

export const membershipRoleSchema = z.enum([
  'OWNER',
  'ADMIN',
  'SALES',
  'CONTRACT_MANAGER',
  'GUARD_MANAGER',
  'SUPERVISOR',
  'VIEWER',
]);

export const membershipStatusSchema = z.enum([
  'PENDING',
  'ACTIVE',
  'SUSPENDED',
]);

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

export const createInvitationSchema = z
  .object({
    email: userEmailSchema.optional(),
    phoneE164: userPhoneE164Schema.optional(),
    roles: invitableMembershipRolesSchema,
    deliveryChannel: invitationDeliveryChannelSchema,
  })
  .superRefine((invitation, context) => {
    if (invitation.roles.includes('ADMIN') && invitation.roles.length > 1) {
      context.addIssue({
        code: 'custom',
        path: ['roles'],
        message: 'El rol Administrador no puede combinarse con otros roles.',
      });
    }

    if (!invitation.email && !invitation.phoneE164) {
      context.addIssue({
        code: 'custom',
        message: 'Debes indicar un correo electrónico o un teléfono.',
      });
      return;
    }

    if (invitation.deliveryChannel === 'EMAIL' && !invitation.email) {
      context.addIssue({
        code: 'custom',
        path: ['email'],
        message:
          'Debes indicar un correo electrónico para enviar la invitación.',
      });
    }

    if (invitation.deliveryChannel === 'WHATSAPP' && !invitation.phoneE164) {
      context.addIssue({
        code: 'custom',
        path: ['phoneE164'],
        message:
          'Debes indicar un teléfono para enviar la invitación por WhatsApp.',
      });
    }
  });

export const invitationPreviewSchema = z.object({
  companyName: z.string(),
  email: userEmailSchema.nullable(),
  phoneE164: userPhoneE164Schema.nullable(),
  deliveryChannel: invitationDeliveryChannelSchema,
  roles: z.array(membershipRoleSchema),
  expiresAt: z.iso.datetime(),
});

export const createInvitationResponseSchema = z.object({
  id: z.string(),
  token: invitationTokenSchema,
  email: userEmailSchema.nullable(),
  phoneE164: userPhoneE164Schema.nullable(),
  deliveryChannel: invitationDeliveryChannelSchema,
  roles: invitableMembershipRolesSchema,
  expiresAt: z.iso.datetime(),
});

export const acceptInvitationResponseSchema = z.object({
  membershipId: z.string(),
  companyName: z.string(),
  status: z.literal('PENDING'),
  verificationToken: contactVerificationTokenSchema,
  verificationExpiresAt: z.iso.datetime(),
});

export const companyMembershipResponseSchema = z.object({
  id: z.string(),
  roles: membershipRolesSchema,
  status: membershipStatusSchema,
  company: membershipCompanyResponseSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const companyUserResponseSchema = z.object({
  id: z.string(),
  roles: membershipRolesSchema,
  status: membershipStatusSchema,
  createdAt: z.iso.datetime(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: userEmailSchema.nullable(),
    phoneE164: userPhoneE164Schema.nullable(),
    active: z.boolean(),
  }),
});

export type MembershipRole = z.infer<typeof membershipRoleSchema>;
export type MembershipStatus = z.infer<typeof membershipStatusSchema>;
export type InvitationDeliveryChannel = z.infer<
  typeof invitationDeliveryChannelSchema
>;
export type InvitationPreview = z.infer<typeof invitationPreviewSchema>;
export type CreateInvitationResponse = z.infer<
  typeof createInvitationResponseSchema
>;
export type AcceptInvitationResponse = z.infer<
  typeof acceptInvitationResponseSchema
>;
export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type CompanyMembershipResponse = z.infer<
  typeof companyMembershipResponseSchema
>;
export type CompanyUserResponse = z.infer<typeof companyUserResponseSchema>;
