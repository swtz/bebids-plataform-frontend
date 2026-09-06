import { z } from 'zod';
import { optionalNullable, toUpdateSchema, uuidSchema } from './common';

export const createVoucherSchema = z.object({
  amount: z.coerce.number({ invalid_type_error: 'Campo obrigatório' }),
  description: optionalNullable(z.string().max(30, 'Máximo 30 caracteres')),
});
export type CreateVoucherInput = z.infer<typeof createVoucherSchema>;

/**
 * UpdateVoucherDto do backend tem um campo extra `id` (opcional em geral,
 * mas OBRIGATÓRIO quando a edição passa por `PATCH /voucher/me/user/:id` —
 * ali o `:id` da rota é o usuário-alvo, e o corpo precisa dizer QUAL vale
 * daquele usuário está sendo editado via este `id`).
 */
export const updateVoucherSchema = toUpdateSchema(createVoucherSchema).extend({
  id: uuidSchema.optional(),
});
export type UpdateVoucherInput = z.infer<typeof updateVoucherSchema>;

export interface Voucher {
  id: string;
  amount: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; lastName: string; nickname: string } | null;
  createdBy: { id: string; name: string; nickname: string } | null;
}
