import { z } from "zod";

export const companySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre de la empresa es obligatorio.')
    .max(120, 'El nombre no puede superar los 120 caracteres.'),

  legalName: z
    .string()
    .trim()
    .max(180, 'La razón social no puede superar los 180 caracteres.'),

  rfc: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase())
    .refine(
      (value) =>
        value === '' || /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(value),
      'El RFC no tiene un formato válido.',
    ),

  address: z
    .string()
    .trim()
    .max(250, 'La dirección no puede superar los 250 caracteres.'),

  timezone: z
    .string()
    .trim()
    .min(1, 'La zona horaria es obligatoria.'),
});

export type CompanyFormValues = z.infer<typeof companySchema>;