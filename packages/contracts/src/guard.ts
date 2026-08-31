import { z } from 'zod';

const guardFullnameSchema = z
  .string()
  .trim()
  .min(1, 'El nombre completo es obligatorio.')
  .max(150, 'El nombre completo no puede superar los 150 caracteres.');

const guardEmployeeNumberSchema = z
  .string()
  .trim()
  .min(1, 'El número de empleado es obligatorio.')
  .max(30, 'El número de empleado no puede superar los 30 caracteres.');

const guardPhoneSchema = z
  .string()
  .trim()
  .max(20, 'El teléfono no puede superar los 20 caracteres.');

export const guardFormSchema = z.object({
  fullname: guardFullnameSchema,
  employeeNumber: guardEmployeeNumberSchema,
  phone: guardPhoneSchema,
});

export const createGuardSchema = guardFormSchema;
export const updateGuardSchema = guardFormSchema;

export const guardResponseSchema = z.object({
  id: z.string(),
  fullname: guardFullnameSchema,
  employeeNumber: guardEmployeeNumberSchema,
  phone: guardPhoneSchema.nullable(),
  companyId: z.string(),
  active: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  deletedAt: z.iso.datetime().nullable(),
});

export type GuardFormValues = z.infer<typeof guardFormSchema>;
export type CreateGuardInput = z.infer<typeof createGuardSchema>;
export type UpdateGuardInput = z.infer<typeof updateGuardSchema>;
export type Guard = z.infer<typeof guardResponseSchema>;