import { z } from 'zod';

export const assignmentSchema = z.object({
    guardId: z
        .string()
        .trim()
        .min(1, 'Debes seleccionar un guardia.'),

    contractId: z
        .string()
        .trim()
        .min(1, 'Debes seleccionar un contrato.'),

    startedAt: z
        .string()
        .trim()
        .refine(
            (value) =>
                value === '' || !Number.isNaN(new Date(value).getTime()),
            'La fecha de inicio no es válida.',
        ),
});

export type AssignmentFormValues = z.infer<
    typeof assignmentSchema
>;