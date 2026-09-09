import { z } from 'zod';

const guardFullNameSchema = z
  .string()
  .trim()
  .min(1, 'El nombre completo es obligatorio.')
  .max(150, 'El nombre completo no puede superar los 150 caracteres.');

const guardFatherFullNameSchema = z
  .string()
  .trim()
  .min(1, 'El nombre completo del padre es obligatorio.')
  .max(
    150,
    'El nombre completo del padre no puede superar los 150 caracteres.',
  );
const guardMotherFullNameSchema = z
  .string()
  .trim()
  .min(1, 'El nombre completo de la madre es obligatorio.')
  .max(
    150,
    'El nombre completo de la madre no puede superar los 150 caracteres.',
  );

const guardBirthDateSchema = z
  .string()
  .trim()
  .min(1, 'La fecha de nacimiento es obligatoria.')
  .refine(isValidDateOnly, 'La fecha de nacimiento no es válida.')
  .refine(
    (value) => new Date(`${value}T00:00:00.000Z`) <= new Date(),
    'La fecha de nacimiento no puede ser posterior a la fecha actual.',
  );

const guardBirthDateResponseSchema = z.iso.datetime();

const guardBirthPlaceSchema = z
  .string()
  .trim()
  .min(1, 'El lugar de nacimiento es obligatorio.')
  .max(150, 'El lugar de nacimiento no puede superar los 150 caracteres.');

const guardEmployeeNumberSchema = z
  .string()
  .trim()
  .min(1, 'El número de empleado es obligatorio.')
  .max(30, 'El número de empleado no puede superar los 30 caracteres.');

const guardHiredAtSchema = z
  .string()
  .trim()
  .min(1, 'La fecha de contratación es obligatoria.')
  .refine(isValidDateOnly, 'La fecha de contratación no es válida.')
  .refine(
    (value) => new Date(`${value}T00:00:00.000Z`) <= new Date(),
    'La fecha de contratación no puede ser posterior a la fecha actual.',
  );

const guardHiredAtResponseSchema = z.iso.datetime();

const guardPhoneSchema = z
  .string()
  .trim()
  .max(20, 'El teléfono no puede superar los 20 caracteres.');

const guardRfcSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}$/, 'El RFC no tiene un formato válido.');

const guardCurpSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(
    /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/,
    'La CURP no tiene un formato válido.',
  );

const guardNssSchema = z
  .string()
  .trim()
  .regex(/^\d{11}$/, 'El NSS debe contener exactamente 11 dígitos.');

const guardStreetSchema = z
  .string()
  .trim()
  .max(150, 'La calle no puede superar los 150 caracteres.');

const guardExteriorNumberSchema = z.string().trim();

const guardInteriorNumberSchema = z.string().trim();

const guardNeighborhoodSchema = z
  .string()
  .trim()
  .max(150, 'La colonia no puede superar los 150 caracteres.');

const guardPostalCodeSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || /^\d{5}$/.test(value),
    'El código postal debe contener 5 dígitos.',
  );

const guardCitySchema = z
  .string()
  .trim()
  .max(150, 'La ciudad no puede superar los 150 caracteres.');

const guardMunicipalitySchema = z
  .string()
  .trim()
  .max(150, 'El municipio no puede superar los 150 caracteres.');

const guardStateSchema = z
  .string()
  .trim()
  .max(150, 'El estado no puede superar los 150 caracteres.');

const guardCountrySchema = z
  .string()
  .trim()
  .max(150, 'El país no puede superar los 150 caracteres.');

const guardFormattedAddressSchema = z.string().trim();

const guardLatitudeSchema = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === '' ||
      (Number.isFinite(Number(value)) &&
        Number(value) >= -90 &&
        Number(value) <= 90),
    'La latitud debe estar entre -90 y 90.',
  );
const guardLongitudeSchema = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === '' ||
      (Number.isFinite(Number(value)) &&
        Number(value) >= -180 &&
        Number(value) <= 180),
    'La longitud debe estar entre -180 y 180.',
  );

const guardExternalPlaceIdSchema = z.string().trim();

function isValidDateOnly(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isHiredAtOnOrAfterBirthDate(data: {
  birthDate: string;
  hiredAt: string;
}): boolean {
  if (!isValidDateOnly(data.birthDate) || !isValidDateOnly(data.hiredAt)) {
    return true;
  }

  return data.hiredAt >= data.birthDate;
}

const guardPersonalSchema = z.object({
  fullName: guardFullNameSchema,
  fatherFullName: guardFatherFullNameSchema,
  motherFullName: guardMotherFullNameSchema,
  birthDate: guardBirthDateSchema,
  birthPlace: guardBirthPlaceSchema,
  employeeNumber: guardEmployeeNumberSchema,
  hiredAt: guardHiredAtSchema,
  rfc: guardRfcSchema,
  curp: guardCurpSchema,
  nss: guardNssSchema,
});

const guardOptionalFormSchema = z.object({
  phone: guardPhoneSchema,
  street: guardStreetSchema,
  exteriorNumber: guardExteriorNumberSchema,
  interiorNumber: guardInteriorNumberSchema,
  neighborhood: guardNeighborhoodSchema,
  postalCode: guardPostalCodeSchema,
  city: guardCitySchema,
  municipality: guardMunicipalitySchema,
  state: guardStateSchema,
  country: guardCountrySchema,
  formattedAddress: guardFormattedAddressSchema,
  latitude: guardLatitudeSchema,
  longitude: guardLongitudeSchema,
  externalPlaceId: guardExternalPlaceIdSchema,
});

export const guardFormSchema = guardPersonalSchema
  .merge(guardOptionalFormSchema)
  .refine(isHiredAtOnOrAfterBirthDate, {
    message:
      'La fecha de contratación no puede ser anterior a la fecha de nacimiento.',
    path: ['hiredAt'],
  });

export const createGuardSchema = guardPersonalSchema
  .merge(guardOptionalFormSchema.partial())
  .refine(isHiredAtOnOrAfterBirthDate, {
    message:
      'La fecha de contratación no puede ser anterior a la fecha de nacimiento.',
    path: ['hiredAt'],
  });

export const updateGuardSchema = createGuardSchema;

export const guardResponseSchema = z.object({
  id: z.string(),
  fullName: guardFullNameSchema,
  fatherFullName: guardFatherFullNameSchema,
  motherFullName: guardMotherFullNameSchema,
  birthDate: guardBirthDateResponseSchema,
  birthPlace: guardBirthPlaceSchema,
  employeeNumber: guardEmployeeNumberSchema,
  hiredAt: guardHiredAtResponseSchema,
  phone: guardPhoneSchema.nullable(),
  rfc: guardRfcSchema,
  curp: guardCurpSchema,
  nss: guardNssSchema,
  street: guardStreetSchema.nullable(),
  exteriorNumber: guardExteriorNumberSchema.nullable(),
  interiorNumber: guardInteriorNumberSchema.nullable(),
  neighborhood: guardNeighborhoodSchema.nullable(),
  postalCode: guardPostalCodeSchema.nullable(),
  city: guardCitySchema.nullable(),
  municipality: guardMunicipalitySchema.nullable(),
  state: guardStateSchema.nullable(),
  country: guardCountrySchema.nullable(),
  formattedAddress: guardFormattedAddressSchema.nullable(),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  externalPlaceId: guardExternalPlaceIdSchema.nullable(),
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
