import { z } from 'zod';

export const loginSchema = z
  .object({
    identifier: z.string().min(1, 'Informe e-mail, apelido ou telefone'),
    password: z.string().min(1, 'Campo obrigatório'),
  })
  .transform(({ identifier, password }) => {
    const isEmail = identifier.includes('@');
    const isPhoneLike = /^[\d()+\- ]+$/.test(identifier) && identifier.replace(/\D/g, '').length >= 10;
    return {
      email: isEmail ? identifier : null,
      phone: isPhoneLike ? identifier : null,
      nickname: !isEmail && !isPhoneLike ? identifier : null,
      password,
    };
  });
export type LoginFormInput = { identifier: string; password: string };
export type LoginPayload = z.infer<typeof loginSchema>;
