import { z } from 'zod';
import { optionalNullable, optionalUuidSchema, toUpdateSchema } from './common';

export const createMotorcycleSchema = z.object({
  licensePlate: z
    .string()
    .min(1, 'Campo obrigatório')
    .regex(/^[A-Za-z]{3}-?\d{4}$|^[A-Za-z]{3}\d[A-Za-z]\d{2}$/, 'Placa inválida'),
  brand: z.string().min(1, 'Campo obrigatório'),
  year: z
    .string()
    .regex(/^\d{4}$/, 'O ano precisa ter 4 dígitos'),
  model: z.string().min(1, 'Campo obrigatório'),
  displacement: optionalNullable(z.string().regex(/^\d+$/, 'Número inválido')),
  color: z.string().min(1, 'Campo obrigatório'),
  isActive: z.boolean().optional(),
  owner: optionalUuidSchema,
  driver: optionalUuidSchema,
  placeCode: optionalNullable(z.string().min(1, 'Campo obrigatório')),
});
export type CreateMotorcycleInput = z.infer<typeof createMotorcycleSchema>;

export const updateMotorcycleSchema = toUpdateSchema(createMotorcycleSchema);
export type UpdateMotorcycleInput = z.infer<typeof updateMotorcycleSchema>;

export interface SmallMotorcycle {
  id: string;
  licensePlate: string;
  brand: string;
  color: string;
  displacement: string | null;
  placeCode: string | null;
}

export interface MotorcycleSmallUser {
  id: string;
  name: string;
  lastName: string;
  nickname: string;
  phone: string;
}

export interface Motorcycle extends SmallMotorcycle {
  createdAt: string;
  updatedAt: string;
  year: string;
  model: string;
  isActive: boolean;
  owner: MotorcycleSmallUser | null;
  driver: MotorcycleSmallUser | null;
}
