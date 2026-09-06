import { z } from 'zod';
import { optionalNullableNumber } from './common';
import { createUserSchema } from './user.schema';
import { createMotorcycleSchema, updateMotorcycleSchema } from './motorcycle.schema';

/** POST /motoboy — cria motoboy + usuário + motocicleta numa tacada só.
 *  O backend usa o CreateUserDto por inteiro (com "role" obrigatório) —
 *  segue exatamente a mesma estrutura da feature de Criar Usuário. */
export const createDeliveryManSchema = z.object({
  user: createUserSchema,
  motorcycle: createMotorcycleSchema,
  deliveryMan: z.object({
    daily: z.coerce.number().min(0, 'Precisa ser um número positivo'),
  }),
});
export type CreateDeliveryManInput = z.infer<typeof createDeliveryManSchema>;

/** POST /motoboy/:motorcycleId — reaproveita uma motocicleta existente. */
export const createDeliveryManWithExistingMotorcycleSchema = z.object({
  motorcycleId: z.string().uuid('Selecione uma motocicleta'),
  user: createUserSchema,
  deliveryMan: z.object({
    daily: z.coerce.number().min(0, 'Precisa ser um número positivo'),
  }),
});
export type CreateDeliveryManWithExistingMotorcycleInput = z.infer<
  typeof createDeliveryManWithExistingMotorcycleSchema
>;

export const updateDeliveryManSchema = z.object({
  motorcycle: updateMotorcycleSchema.optional(),
  daily: optionalNullableNumber(),
});
export type UpdateDeliveryManInput = z.infer<typeof updateDeliveryManSchema>;

export interface DeliveryMan {
  id: string;
  daily: number;
  createdAt: string;
  updatedAt: string;
  tips: unknown[] | null;
  user: unknown;
  motorcycle: unknown | null;
}
