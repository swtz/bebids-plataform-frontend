import { z } from 'zod';
import { brPostalCodeSchema, optionalNullable, toUpdateSchema } from './common';

export const createAddressSchema = z.object({
  street: z.string().min(4, 'Mínimo 4 caracteres').max(48, 'Máximo 48 caracteres'),
  number: optionalNullable(
    z.string().regex(/^\d+$/, 'Número inválido').max(16, 'Máximo 16 caracteres'),
  ),
  complement: optionalNullable(
    z.string().min(8, 'Mínimo 8 caracteres').max(32, 'Máximo 32 caracteres'),
  ),
  referencePoint: optionalNullable(
    z.string().min(8, 'Mínimo 8 caracteres').max(32, 'Máximo 32 caracteres'),
  ),
  neighborhood: z.string().min(4, 'Mínimo 4 caracteres').max(32, 'Máximo 32 caracteres'),
  postalCode: brPostalCodeSchema,
  city: z.string().min(3, 'Mínimo 3 caracteres').max(32, 'Máximo 32 caracteres'),
  stateCode: z.string().length(2, 'UF precisa ter 2 caracteres'),
  location: optionalNullable(z.string().max(32, 'Máximo 32 caracteres')),
  isDefault: z.boolean().optional(),
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>;

export const updateAddressSchema = toUpdateSchema(createAddressSchema);
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;

export interface Address {
  id: string;
  street: string;
  number: string | null;
  complement: string | null;
  referencePoint: string | null;
  neighborhood: string;
  postalCode: string;
  city: string;
  stateCode: string;
  location: string | null;
  isDefault: boolean;
}
