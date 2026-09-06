import { shiftOptions } from '@/types/enums';
import type { FieldConfig } from './FieldConfig';

/** Usado em WorkTimePage (editar), WorkTimePlacePage (criar/editar) e WorkTimeUserPage (definir). */
export const workTimeFields: FieldConfig[] = [
  {
    name: 'shift',
    label: 'Turno',
    type: 'select',
    options: shiftOptions.map(s => ({ value: s, label: s })),
  },
  { name: 'initHour', label: 'Início', type: 'time' },
  { name: 'endHour', label: 'Fim', type: 'time' },
  { name: 'isDefault', label: 'Turno padrão', type: 'checkbox' },
];

/** Usado em IntervalTimePage (editar) e WorkTimeUserPage (criar intervalo). */
export const intervalTimeFields: FieldConfig[] = [
  { name: 'initHour', label: 'Início do intervalo', type: 'time' },
  { name: 'endHour', label: 'Fim do intervalo', type: 'time' },
];
