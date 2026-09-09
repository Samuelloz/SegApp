import { z } from 'zod';

const activeSchema = z.boolean({
  error: 'El estatus debe ser verdadero o falso.',
});

export const updateActiveStatusSchema = z.object({
  active: activeSchema,
});

export type UpdateActiveStatusInput = z.infer<typeof updateActiveStatusSchema>;
