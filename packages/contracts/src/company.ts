import { z } from 'zod';

const companyNameSchema = z
  .string()
  .trim()
  .min(1, 'El nombre de la empresa es obligatorio.')
  .max(120, 'El nombre no puede superar los 120 caracteres.');

const companyLegalNameSchema = z
  .string()
  .trim()
  .max(180, 'La razón social no puede superar los 180 caracteres.');

const companyRfcSchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .refine(
    (value) =>
      value === '' || /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(value),
    'El RFC no tiene un formato válido.',
  );

const companyAddressSchema = z
  .string()
  .trim()
  .max(250, 'La dirección no puede superar los 250 caracteres.');

const companyTimezoneSchema = z
  .string()
  .trim()
  .min(1, 'La zona horaria es obligatoria.');

export const companySettingsSchema = z.object({
  name: companyNameSchema,
  legalName: companyLegalNameSchema,
  rfc: companyRfcSchema,
  address: companyAddressSchema,
  timezone: companyTimezoneSchema,
});

export const updateCompanySchema = companySettingsSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    'Debes proporcionar al menos un campo para actualizar.',
  );

export const companyResponseSchema = z.object({
  id: z.string(),
  name: companyNameSchema,
  legalName: companyLegalNameSchema.nullable(),
  slug: z.string(),
  rfc: companyRfcSchema.nullable(),
  address: companyAddressSchema.nullable(),
  timezone: companyTimezoneSchema,
  active: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  deletedAt: z.iso.datetime().nullable(),
});

export type CompanyFormValues = z.infer<typeof companySettingsSchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type Company = z.infer<typeof companyResponseSchema>;