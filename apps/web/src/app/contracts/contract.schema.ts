import { z } from 'zod';

export const contractSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, 'El nombre del contrato es obligatorio.'),
});

export type ContractFormValues = z.infer<typeof contractSchema>;
