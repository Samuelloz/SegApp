import { z } from 'zod';

import { companySlugSchema } from '@segapp/contracts';

export const companyLoginSchema = z.object({
  companySlug: companySlugSchema,
});

export type CompanyLoginValues = z.infer<typeof companyLoginSchema>;
