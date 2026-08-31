import { z } from 'zod';

const contractNameSchema = z
  .string()
  .trim()
  .min(1, 'El nombre del contrato es obligatorio.')
  .max(180, 'El nombre del contrato no puede superar los 180 caracteres.');

export const contractFormSchema = z.object({
  name: contractNameSchema,
});

export const createContractSchema = contractFormSchema;
export const updateContractSchema = contractFormSchema;

export const contractResponseSchema = z.object({
  id: z.string(),
  name: contractNameSchema,
  companyId: z.string(),
  active: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  deletedAt: z.iso.datetime().nullable(),
});

export type ContractFormValues = z.infer<typeof contractFormSchema>;
export type CreateContractInput = z.infer<typeof createContractSchema>;
export type UpdateContractInput = z.infer<typeof updateContractSchema>;
export type Contract = z.infer<typeof contractResponseSchema>;