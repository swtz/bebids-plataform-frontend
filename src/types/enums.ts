// Espelha 1:1 os enums do backend (mesmos values, para bater com a API).

export const Role = {
  Admin: 'admin',
  Operator: 'operator',
  Motoboy: 'motoboy',
  Customer: 'customer',
} as const;
export type Role = (typeof Role)[keyof typeof Role];
export const roleOptions = Object.values(Role);
export const roleLabels: Record<Role, string> = {
  admin: 'Administrador',
  operator: 'Televendas / Operador',
  motoboy: 'Motoboy',
  customer: 'Cliente',
};

export const PaymentMethod = {
  Money: 'money',
  Credit: 'credit',
  Debit: 'debit',
  Pix: 'pix',
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];
export const paymentMethodOptions = Object.values(PaymentMethod);
export const paymentMethodLabels: Record<PaymentMethod, string> = {
  money: 'Dinheiro',
  credit: 'Cartão de Crédito',
  debit: 'Cartão de Débito',
  pix: 'Pix',
};

export const Shift = {
  Night: 'madrugada',
  Morning: 'manhã',
  Afternoon: 'tarde',
  Evening: 'noite',
  Custom: 'personalizado',
  Default: 'padrão',
  WeekDay: 'semana',
  Weekend: 'final-de-semana',
  Holiday: 'feriado',
} as const;
export type Shift = (typeof Shift)[keyof typeof Shift];
export const shiftOptions = Object.values(Shift);

export const WeekDay = {
  Sunday: 'Domingo',
  Monday: 'Segunda',
  Tuesday: 'Terça',
  Wednesday: 'Quarta',
  Thursday: 'Quinta',
  Friday: 'Sexta',
  Saturday: 'Sábado',
} as const;
export type WeekDay = (typeof WeekDay)[keyof typeof WeekDay];
export const weekDayOptions = Object.values(WeekDay);

export const VoucherFilterType = {
  User: 'user',
  DeliveryMan: 'deliveryMan',
  CreatedBy: 'createdBy',
  Payout: 'payout',
  Settlement: 'settlement',
} as const;
export type VoucherFilterType =
  (typeof VoucherFilterType)[keyof typeof VoucherFilterType];
