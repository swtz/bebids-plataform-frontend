import { z } from 'zod';
import { PaymentMethod } from '@/types/enums';
import { optionalNullable, optionalNullableNumber, optionalUuidSchema, toUpdateSchema } from './common';

export const createDeliverySchema = z.object({
  description: optionalNullable(z.string().max(255, 'Máximo 250 caracteres')),
  totalPurchase: z.coerce.number({ invalid_type_error: 'Campo obrigatório' }),
  deliveryTax: z.coerce.number({ invalid_type_error: 'Campo obrigatório' }),
  paymentMethod: z.nativeEnum(PaymentMethod),
  tip: optionalNullableNumber(),
  motoboy: z.string().uuid('Selecione um motoboy'),
  customer: z.string().uuid('Selecione um cliente'),
  placeCode: z.string().min(1, 'Campo obrigatório'),
});
export type CreateDeliveryInput = z.infer<typeof createDeliverySchema>;

export const updateDeliverySchema = toUpdateSchema(createDeliverySchema).extend({
  isPaid: z.boolean().optional(),
  address: optionalUuidSchema,
});
export type UpdateDeliveryInput = z.infer<typeof updateDeliverySchema>;

export interface DeliverySmallUser {
  id: string;
  name: string;
  lastName: string;
  nickname: string;
  phone: string;
}

export interface DeliveryMotoboy extends DeliverySmallUser {
  workTime: { shift: string; initHour: string; endHour: string; duration: string } | null;
  motorcycle: { licensePlate: string; brand: string; color: string } | null;
}

export interface DeliveryCustomer extends DeliverySmallUser {}

export interface Delivery {
  id: string;
  createdAt: string;
  updatedAt: string;
  description: string | null;
  totalPurchase: number;
  deliveryTax: number;
  paymentMethod: string | null;
  isPaid: boolean;
  motorcycleLicensePlate: string;
  placeCode: string;
  tip: { id: string; amount: number } | null;
  /** Plano — vem direto do SmallResponseUserDto, sem aninhar em `.user`. */
  operator: DeliverySmallUser | null;
  /** Também plano (id já é o id do usuário motoboy, não do registro DeliveryMan). */
  motoboy: DeliveryMotoboy | null;
  customer: DeliveryCustomer | null;
  address: { id: string; street: string; number: string | null; neighborhood: string; city: string; stateCode: string } | null;
}
