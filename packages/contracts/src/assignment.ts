import { z } from 'zod';

import { contractResponseSchema } from './contract';
import { guardResponseSchema } from './guard';

const assignmentGuardIdSchema = z
  .string()
  .trim()
  .min(1, 'Debes seleccionar un guardia.');

const assignmentContractIdSchema = z
  .string()
  .trim()
  .min(1, 'Debes seleccionar un contrato.');

const assignmentFormDateSchema = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === '' || !Number.isNaN(new Date(value).getTime()),
    'La fecha de inicio no es válida.',
  );

const optionalApiDateSchema = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === '' || !Number.isNaN(new Date(value).getTime()),
    'La fecha no es válida.',
  )
  .transform((value) => value || undefined)
  .optional();

export const assignmentFormSchema = z.object({
  guardId: assignmentGuardIdSchema,
  contractId: assignmentContractIdSchema,
  startedAt: assignmentFormDateSchema,
});

export const createAssignmentSchema = z.object({
  guardId: assignmentGuardIdSchema,
  contractId: assignmentContractIdSchema,
  startedAt: optionalApiDateSchema,
});

export const endAssignmentSchema = z
  .object({
    endedAt: optionalApiDateSchema,
  })
  .default({});

export const guardAssignmentResponseSchema = z.object({
  id: z.string(),
  guardId: assignmentGuardIdSchema,
  contractId: assignmentContractIdSchema,
  companyId: z.string(),
  startedAt: z.iso.datetime(),
  endedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  guard: guardResponseSchema,
  contract: contractResponseSchema,
});

export type AssignmentFormValues = z.infer<typeof assignmentFormSchema>;
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type EndAssignmentInput = z.infer<typeof endAssignmentSchema>;
export type GuardAssignment = z.infer<typeof guardAssignmentResponseSchema>;