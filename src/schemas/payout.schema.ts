import { z } from 'zod';
import { optionalEmailSchema, optionalNullable, optionalUuidSchema } from './common';

/**
 * Espelha UserUniqueFieldsDto: todos os campos são opcionais e o usuário
 * preenche só UM deles para identificar o motoboy — os demais precisam ir
 * como `null`, nunca como string vazia.
 */
const userUniqueFieldsSchema = z.object({
  id: optionalUuidSchema,
  nickname: optionalNullable(z.string()),
  name: optionalNullable(z.string()),
  lastName: optionalNullable(z.string()),
  email: optionalEmailSchema,
  phone: optionalNullable(z.string()),
  secondPhone: optionalNullable(z.string()),
});

export const createPayoutSchema = z.object({
  user: userUniqueFieldsSchema,
  from: z.string().min(1, 'Campo obrigatório'),
  to: z.string().min(1, 'Campo obrigatório'),
  placeCode: z.string().min(1, 'Campo obrigatório'),
});
export type CreatePayoutInput = z.infer<typeof createPayoutSchema>;

export interface Payout {
  id?: string;
  placeCode?: string;
  createdAt?: string;
  updatedAt?: string;
  weekDay: string;
  workDay: string;
  isClosed?: boolean;
  totalDeliveries: number;
  quantityDeliveries: number;
  motoboyDaily: number;
  motoboyTips: number;
  subtotal: number;
  totalSpending: number;
  total: number;
  motoboy: {
    id: string;
    name: string;
    lastName: string;
    nickname: string;
    phone: string;
    motorcycle: { licensePlate: string; brand: string; color: string } | null;
    workTime: { shift: string; initHour: string; endHour: string; duration: string } | null;
  };
  vouchers: { id: string; amount: number; description: string | null }[] | null;
}
