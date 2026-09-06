import { z } from 'zod';
import { optionalEmailSchema, optionalNullable, optionalUuidSchema } from './common';

/** Mesma lógica de payout.schema.ts — ver comentário lá. */
const userUniqueFieldsSchema = z.object({
  id: optionalUuidSchema,
  nickname: optionalNullable(z.string()),
  name: optionalNullable(z.string()),
  lastName: optionalNullable(z.string()),
  email: optionalEmailSchema,
  phone: optionalNullable(z.string()),
  secondPhone: optionalNullable(z.string()),
});

export const createSettlementSchema = z.object({
  user: userUniqueFieldsSchema,
  from: z.string().min(1, 'Campo obrigatório'),
  to: z.string().min(1, 'Campo obrigatório'),
  placeCode: z.string().min(1, 'Campo obrigatório'),
  initValue: z.coerce.number({ invalid_type_error: 'Campo obrigatório' }),
  description: optionalNullable(z.string().max(130, 'Máximo 130 caracteres')),
});
export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;

export interface Settlement {
  id?: string;
  placeCode?: string;
  createdAt?: string;
  updatedAt?: string;
  weekDay: string;
  workDay: string;
  isClosed?: boolean;
  initValue?: number;
  quantityDeliveries: number;
  totalRemainingMotoboy: number;
  moneySubtotal: number;
  cardSubtotal: number;
  pixSubtotal: number;
  subtotal: number;
  description?: string | null;
  currentTotal: number;
  expectedTotal: number;
  operator: {
    id: string;
    name: string;
    lastName: string;
    nickname: string;
    phone: string;
    workTime: { shift: string; initHour: string; endHour: string; duration: string } | null;
  };
  vouchers: { id: string; amount: number; description: string | null }[] | null;
}
