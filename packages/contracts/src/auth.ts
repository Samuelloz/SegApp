import { z } from 'zod';

import { companySlugSchema } from './company';

export const userNameSchema = z
  .string()
  .trim()
  .min(1, 'El nombre es obligatorio.')
  .max(120, 'El nombre no puede superar los 120 caracteres.');

export const userEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'El correo electrónico es obligatorio.')
  .max(254, 'El correo electrónico no puede superar los 254 caracteres.')
  .email('El correo electrónico no tiene un formato válido.');

export const userPhoneE164Schema = z
  .string()
  .trim()
  .regex(
    /^\+[1-9]\d{1,14}$/,
    'El teléfono debe tener formato internacional, por ejemplo +528711234567.',
  );

export const userPasswordSchema = z
  .string()
  .min(15, 'La contraseña debe contener al menos 15 caracteres.')
  .max(128, 'La contraseña no puede superar los 128 caracteres.');

const loginPasswordSchema = z
  .string()
  .min(1, 'La contraseña es obligatoria.')
  .max(128, 'La contraseña no puede superar los 128 caracteres.');

export const invitationTokenSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_-]{43}$/, 'El token de invitación no es válido.');

export const contactVerificationTokenSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_-]{43}$/, 'El token de verificación no es válido.');

export const loginSchema = z.object({
  companySlug: companySlugSchema,
  identifier: z.union([userEmailSchema, userPhoneE164Schema], {
    error: 'Ingresa un correo electrónico o teléfono válido.',
  }),
  password: loginPasswordSchema,
});

export const acceptInvitationSchema = z.object({
  token: invitationTokenSchema,
  name: userNameSchema,
  email: userEmailSchema.optional(),
  phoneE164: userPhoneE164Schema.optional(),
  password: userPasswordSchema,
});

export const userResponseSchema = z.object({
  id: z.string(),
  email: userEmailSchema.nullable(),
  phoneE164: userPhoneE164Schema.nullable(),
  name: userNameSchema,
  active: z.boolean(),
  emailVerifiedAt: z.iso.datetime().nullable(),
  phoneVerifiedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
