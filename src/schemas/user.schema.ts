import { z } from 'zod';
import { brPhoneSchema, optionalBrPhoneSchema, optionalEmailSchema, toUpdateSchema } from './common';
import { Role } from '@/types/enums';

export const createUserSchema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres').max(130, 'Máximo 130 caracteres'),
  lastName: z.string().min(3, 'Mínimo 3 caracteres').max(130, 'Máximo 130 caracteres'),
  nickname: z.string().min(3, 'Mínimo 3 caracteres').max(130, 'Máximo 130 caracteres'),
  phone: brPhoneSchema,
  secondPhone: optionalBrPhoneSchema,
  email: optionalEmailSchema,
  role: z.nativeEnum(Role),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  placeCode: z.string().min(1, 'Campo obrigatório'),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = toUpdateSchema(
  createUserSchema.omit({ password: true, role: true }),
);
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Campo obrigatório'),
  newPassword: z.string().min(6, 'Mínimo 6 caracteres'),
});
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

export interface SmallUser {
  id: string;
  name: string;
  lastName: string;
  nickname: string;
  phone: string;
}

export interface User extends SmallUser {
  createdAt: string;
  updatedAt: string;
  secondPhone: string | null;
  email: string | null;
  placeCode: string;
  roles: Role[] | null;
  vouchers: unknown[] | null;
  workTime: unknown | null;
  intervalTime: unknown | null;
}
