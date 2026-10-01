import { z } from 'zod';

import { acceptInvitationSchema, userPasswordSchema } from '@segapp/contracts';

export const invitationRegistrationSchema = acceptInvitationSchema
  .pick({
    name: true,
    password: true,
  })
  .extend({
    confirmPassword: userPasswordSchema,
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  });

export type InvitationRegistrationInput = z.infer<
  typeof invitationRegistrationSchema
>;
