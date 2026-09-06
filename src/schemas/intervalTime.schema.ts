import { z } from 'zod';
import { isoDateTimeSchema, toUpdateSchema } from './common';

export const createIntervalTimeSchema = z.object({
  initHour: isoDateTimeSchema,
  endHour: isoDateTimeSchema,
});
export type CreateIntervalTimeInput = z.infer<typeof createIntervalTimeSchema>;

/** UpdateIntervalTimeDto (PartialType) — mesmo raciocínio de workTime.schema.ts. */
export const updateIntervalTimeSchema = toUpdateSchema(createIntervalTimeSchema);
export type UpdateIntervalTimeInput = z.infer<typeof updateIntervalTimeSchema>;

export type IntervalTimeOwner = {
  id: string;
  name: string;
  lastName: string;
  nickname: string;
  phone: string;
};

export interface IntervalTime {
  id: string;
  initHour: string;
  endHour: string;
  duration: string;
  createdAt: string;
  updatedAt: string;
  /**
   * O backend não inclui o dono do intervalo (`ResponseIntervalTimeDto` não
   * tem campo `user`, só `workTime`) — só dá pra inferir com segurança
   * quando o WorkTime NÃO é compartilhado (exatamente 1 usuário na lista).
   * Se for compartilhado, `workTime.users` traz todo mundo que usa aquele
   * horário, não só o dono deste IntervalTime específico.
   */
  workTime: { id: string; isShared: boolean; users: IntervalTimeOwner[] | null };
}
