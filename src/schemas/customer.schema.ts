import { z } from 'zod';
import { brPhoneSchema, optionalBrPhoneSchema, optionalEmailSchema, toUpdateSchema } from './common';
import { createAddressSchema } from './address.schema';

export const createCustomerSchema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres').max(130, 'Máximo 130 caracteres'),
  lastName: z.string().min(3, 'Mínimo 3 caracteres').max(130, 'Máximo 130 caracteres'),
  nickname: z.string().min(3, 'Mínimo 3 caracteres').max(130, 'Máximo 130 caracteres'),
  phone: brPhoneSchema,
  secondPhone: optionalBrPhoneSchema,
  email: optionalEmailSchema,
});
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

/** POST /customer — cliente + endereço juntos, como no CustomerAddressController. */
export const createCustomerWithAddressSchema = z.object({
  customer: createCustomerSchema,
  address: createAddressSchema,
});
export type CreateCustomerWithAddressInput = z.infer<
  typeof createCustomerWithAddressSchema
>;

export const updateCustomerSchema = toUpdateSchema(createCustomerSchema);
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

export interface Customer {
  id: string;
  name: string;
  lastName: string;
  nickname: string;
  phone: string;
  secondPhone: string | null;
  email: string | null;
  addresses: unknown[] | null;
}
