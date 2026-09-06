import { z } from 'zod';
import { brPhoneSchema, optionalBrPhoneSchema, optionalNullable, toUpdateSchema } from './common';
import { createAddressSchema } from './address.schema';
import { createWorkTimeSchema } from './workTime.schema';

export const createPlaceSchema = z.object({
  name: z.string().min(1, 'Campo obrigatório').max(255, 'Máximo 255 caracteres'),
  businessName: z.string().min(1, 'Campo obrigatório').max(255, 'Máximo 255 caracteres'),
  cnpj: z.string().min(1, 'Campo obrigatório').max(18, 'Máximo 18 caracteres'),
  cpf: optionalNullable(z.string().max(14, 'Máximo 14 caracteres')),
  phone: brPhoneSchema,
  secondPhone: optionalBrPhoneSchema,
  email: z.string().email('E-mail inválido'),
  code: z.string().min(1, 'Campo obrigatório'),
  address: createAddressSchema,
  postalBox: createAddressSchema.optional(),
  workTime: createWorkTimeSchema,
});
export type CreatePlaceInput = z.infer<typeof createPlaceSchema>;

export const updatePlaceSchema = toUpdateSchema(
  createPlaceSchema.omit({ address: true, postalBox: true, workTime: true }),
);
export type UpdatePlaceInput = z.infer<typeof updatePlaceSchema>;

export interface SmallPlace {
  id: string;
  code: string;
  name: string;
  businessName: string;
  phone: string;
  cnpj: string;
  cpf: string | null;
}

export interface Place extends SmallPlace {
  owners: unknown[] | null;
  address: unknown | null;
  postalBox: unknown | null;
  workTimes: unknown[] | null;
  email: string;
  secondPhone: string | null;
}
