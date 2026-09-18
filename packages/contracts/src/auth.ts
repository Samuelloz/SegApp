import { z } from 'zod';

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

export const userPasswordSchema = z
  .string()
  .min(15, 'La contraseña debe contener al menos 15 caracteres.')
  .max(128, 'La contraseña no puede superar los 128 caracteres.');

const loginPasswordSchema = z
  .string()
  .min(1, 'La contraseña es obligatoria.')
  .max(128, 'La contraseña no puede superar los 128 caracteres.');

export const loginSchema = z.object({
  email: userEmailSchema,
  password: loginPasswordSchema,
});

export const acceptInvitationSchema = z.object({
  token: z
    .string()
    .trim()
    .min(1, 'El token de invitación es obligatorio.')
    .max(256, 'El token de invitación no es válido.'),
  name: userNameSchema,
  password: userPasswordSchema,
});

export const userResponseSchema = z.object({
  id: z.string(),
  email: userEmailSchema,
  name: userNameSchema,
  active: z.boolean(),
  emailVerifiedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
