import { z } from 'zod';

export const guardSchema = z.object({
    fullname: z
        .string()
        .trim()
        .min(1, 'El nombre completo es obligatorio.'),

    employeeNumber: z
        .string()
        .trim()
        .min(1, 'El número de empleado es obligatorio.'),

    phone: z
        .string()
        .trim()
        .optional(),

});

export type GuardFormValues = z.infer<typeof guardSchema>;