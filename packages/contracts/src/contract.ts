import { z } from 'zod';

const contractNameSchema = z
  .string()
  .trim()
  .min(1, 'El nombre del contrato es obligatorio.')
  .max(180, 'El nombre del contrato no puede superar los 180 caracteres.');

const contractClientLegalNameSchema = z
  .string()
  .trim()
  .min(1, 'La razón social del cliente es obligatoria.')
  .max(
    150,
    'El nombre legal o razón social no puede superar los 150 caracteres.',
  );

const contractClientRfcSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(
    /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/,
    'El RFC del cliente no tiene un formato válido.',
  );

const contractStartDateSchema = z
  .string()
  .trim()
  .min(1, 'La fecha de inicio del contrato es obligatoria.')
  .refine(isValidDateOnly, 'La fecha de inicio del contrato no es válida.');

const contractStartDateResponseSchema = z.iso.datetime();

const contractEndDateSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || isValidDateOnly(value),
    'La fecha de finalización del contrato no es válida.',
  );

const contractEndDateResponseSchema = z.iso.datetime();

const contractContactNameSchema = z
  .string()
  .trim()
  .min(1, 'El nombre del contacto es obligatorio.')
  .max(150, 'El nombre del contacto no puede superar los 150 caracteres.');

const contractContactPhoneSchema = z
  .string()
  .trim()
  .min(1, 'El número de teléfono del contacto es obligatorio.')
  .max(
    20,
    'El número de teléfono del contacto no puede superar los 20 caracteres.',
  )
  .refine(
    (value) => /^[+\d\s().-]+$/.test(value),
    'El teléfono solo puede contener números, espacios, paréntesis, guiones y el signo +.',
  )
  .refine((value) => {
    const digits = value.replace(/\D/g, '');

    return digits.length >= 10 && digits.length <= 15;
  }, 'El teléfono del contacto debe contener entre 10 y 15 dígitos.');

const contractContactEmailSchema = z
  .string()
  .trim()
  .max(254, 'El correo del contacto no puede superar los 254 caracteres.')
  .refine(
    (value) => value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    'El correo del contacto no tiene un formato válido.',
  );

const contractRequiredGuardCountSchema = z
  .number({
    error: 'El número de guardias es obligatorio.',
  })
  .int('El número de guardias debe ser un entero.')
  .min(1, 'El número de guardias debe ser mayor a 0.');

const contractStreetSchema = z
  .string()
  .trim()
  .max(150, 'La calle no puede superar los 150 caracteres.');

const contractExteriorNumberSchema = z.string().trim();

const contractInteriorNumberSchema = z.string().trim();

const contractNeighborhoodSchema = z
  .string()
  .trim()
  .max(150, 'La colonia no puede superar los 150 caracteres.');

const contractPostalCodeSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || /^\d{5}$/.test(value),
    'El código postal debe contener 5 dígitos.',
  );

const contractCitySchema = z
  .string()
  .trim()
  .max(150, 'La ciudad no puede superar los 150 caracteres.');

const contractMunicipalitySchema = z
  .string()
  .trim()
  .max(150, 'El municipio no puede superar los 150 caracteres.');

const contractStateSchema = z
  .string()
  .trim()
  .max(150, 'El estado no puede superar los 150 caracteres.');

const contractCountrySchema = z
  .string()
  .trim()
  .max(150, 'El país no puede superar los 150 caracteres.');

const contractFormattedAddressSchema = z.string().trim();

const contractLatitudeSchema = z
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

const contractLongitudeSchema = z
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

const contractExternalPlaceIdSchema = z.string().trim();

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

function isEndDateOnOrAfterStartDate(data: {
  startDate: string;
  endDate?: string;
}): boolean {
  if (
    !data.endDate ||
    !isValidDateOnly(data.startDate) ||
    !isValidDateOnly(data.endDate)
  ) {
    return true;
  }

  return data.endDate >= data.startDate;
}

function hasCompleteCoordinates(data: {
  latitude?: string;
  longitude?: string;
}): boolean {
  return Boolean(data.latitude) === Boolean(data.longitude);
}

const contractSchema = z.object({
  name: contractNameSchema,
  clientLegalName: contractClientLegalNameSchema,
  clientRfc: contractClientRfcSchema,
  startDate: contractStartDateSchema,
  contactName: contractContactNameSchema,
  contactPhone: contractContactPhoneSchema,
  requiredGuardCount: contractRequiredGuardCountSchema,
});

const contractOptionalFormSchema = z.object({
  endDate: contractEndDateSchema,
  contactEmail: contractContactEmailSchema,
  street: contractStreetSchema,
  exteriorNumber: contractExteriorNumberSchema,
  interiorNumber: contractInteriorNumberSchema,
  neighborhood: contractNeighborhoodSchema,
  postalCode: contractPostalCodeSchema,
  city: contractCitySchema,
  municipality: contractMunicipalitySchema,
  state: contractStateSchema,
  country: contractCountrySchema,
  formattedAddress: contractFormattedAddressSchema,
  latitude: contractLatitudeSchema,
  longitude: contractLongitudeSchema,
  externalPlaceId: contractExternalPlaceIdSchema,
});

export const contractFormSchema = contractSchema
  .merge(contractOptionalFormSchema)
  .refine(isEndDateOnOrAfterStartDate, {
    message:
      'La fecha de finalización no puede ser anterior a la fecha de inicio.',
    path: ['endDate'],
  })
  .refine(hasCompleteCoordinates, {
    message: 'La latitud y la longitud deben proporcionarse juntas.',
    path: ['longitude'],
  });

export const createContractSchema = contractSchema
  .merge(contractOptionalFormSchema.partial())
  .refine(isEndDateOnOrAfterStartDate, {
    message:
      'La fecha de finalización no puede ser anterior a la fecha de inicio.',
    path: ['endDate'],
  })
  .refine(hasCompleteCoordinates, {
    message: 'La latitud y la longitud deben proporcionarse juntas.',
    path: ['longitude'],
  });

export const updateContractSchema = createContractSchema;

export const contractResponseSchema = z.object({
  id: z.string(),
  name: contractNameSchema,
  clientLegalName: contractClientLegalNameSchema,
  clientRfc: contractClientRfcSchema,
  startDate: contractStartDateResponseSchema,
  endDate: contractEndDateResponseSchema.nullable(),
  contactName: contractContactNameSchema,
  contactPhone: contractContactPhoneSchema,
  contactEmail: contractContactEmailSchema.nullable(),
  requiredGuardCount: contractRequiredGuardCountSchema,
  street: contractStreetSchema.nullable(),
  exteriorNumber: contractExteriorNumberSchema.nullable(),
  interiorNumber: contractInteriorNumberSchema.nullable(),
  neighborhood: contractNeighborhoodSchema.nullable(),
  postalCode: contractPostalCodeSchema.nullable(),
  city: contractCitySchema.nullable(),
  municipality: contractMunicipalitySchema.nullable(),
  state: contractStateSchema.nullable(),
  country: contractCountrySchema.nullable(),
  formattedAddress: contractFormattedAddressSchema.nullable(),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  externalPlaceId: contractExternalPlaceIdSchema.nullable(),
  active: z.boolean(),
  companyId: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  deletedAt: z.iso.datetime().nullable(),
});

export type ContractFormValues = z.infer<typeof contractFormSchema>;
export type CreateContractInput = z.infer<typeof createContractSchema>;
export type UpdateContractInput = z.infer<typeof updateContractSchema>;
export type Contract = z.infer<typeof contractResponseSchema>;
