import { z } from 'zod';
import { isoDateTimeSchema, toUpdateSchema } from './common';
import { Shift } from '@/types/enums';

export const createWorkTimeSchema = z.object({
  shift: z.nativeEnum(Shift),
  initHour: isoDateTimeSchema,
  endHour: isoDateTimeSchema,
  isDefault: z.boolean().optional(),
});
export type CreateWorkTimeInput = z.infer<typeof createWorkTimeSchema>;

/**
 * UpdateWorkTimeDto (PartialType) — todo campo vira opcional/nullable,
 * inclusive shift/initHour/endHour: em branco, o backend simplesmente não
 * altera aquele campo (ver `generate-duration-time.ts`/`work-time.service.ts`,
 * que só recalculam quando `dto.initHour`/`dto.endHour` vêm preenchidos).
 */
export const updateWorkTimeSchema = toUpdateSchema(createWorkTimeSchema);
export type UpdateWorkTimeInput = z.infer<typeof updateWorkTimeSchema>;

export interface WorkTime {
  id: string;
  shift: Shift;
  createdAt: string;
  updatedAt: string;
  initHour: string;
  endHour: string;
  duration: string;
  isDefault: boolean;
  isShared: boolean;
  places: unknown[] | null;
  users: unknown[] | null;
  intervalTimes: unknown[] | null;
}
