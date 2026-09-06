import { z, type ZodTypeAny } from 'zod';

/**
 * Backend usa `@IsOptional()` (class-validator) em praticamente todo campo
 * opcional. Essa decoration só "pula" a validação quando o valor é
 * `null` ou `undefined` — uma STRING VAZIA não é pulada e cai nos demais
 * validadores (`@IsPhoneNumber`, `@IsEmail` etc.), que rejeitam "".
 *
 * Como os <input> HTML sempre entregam "" quando vazios (nunca `undefined`),
 * todo campo opcional do formulário precisa passar por este helper: ele
 * converte "" (e `undefined`) para `null` ANTES de validar, e valida
 * normalmente quando há conteúdo. Resultado sempre é `T | null` — nunca
 * string vazia, nunca `undefined` "solto" (que o JSON.stringify remove sem
 * avisar, dificultando depurar).
 */
export function optionalNullable<T extends ZodTypeAny>(schema: T) {
  return z.preprocess(
    value => (value === '' || value === undefined ? null : value),
    schema.nullable(),
  ) as z.ZodType<z.infer<T> | null, z.ZodTypeDef, unknown>;
}

/** Atalho para strings opcionais simples (com limites de tamanho, se passados). */
export function optionalNullableString(options?: { min?: number; max?: number }) {
  let schema = z.string();
  if (options?.min) schema = schema.min(options.min, `Mínimo ${options.min} caracteres`);
  if (options?.max) schema = schema.max(options.max, `Máximo ${options.max} caracteres`);
  return optionalNullable(schema);
}

/** Número opcional: "" vira null; caso contrário, coage e valida como number. */
export function optionalNullableNumber() {
  return z.preprocess(value => {
    if (value === '' || value === undefined || value === null) return null;
    return typeof value === 'string' ? Number(value) : value;
  }, z.number({ invalid_type_error: 'Precisa ser um número' }).nullable());
}

/** Telefone BR com DDD (10 ou 11 dígitos), aceita máscara ou só números. */
export const brPhoneSchema = z
  .string()
  .min(1, 'Telefone inválido')
  .refine(value => {
    const digits = value.replace(/\D/g, '');
    return digits.length === 10 || digits.length === 11;
  }, 'Telefone inválido (informe DDD + número)');

/** Versão opcional: campo vazio vira `null` (nunca ""), como o backend exige. */
export const optionalBrPhoneSchema = optionalNullable(brPhoneSchema);

export const brPostalCodeSchema = z
  .string()
  .refine(v => /^\d{5}-?\d{3}$/.test(v), 'CEP inválido (formato 00000-000)');

export const uuidSchema = z.string().uuid({ message: 'Formato inválido' });

export const optionalUuidSchema = optionalNullable(uuidSchema);

export const emailSchema = z.string().email('E-mail inválido');

export const optionalEmailSchema = optionalNullable(emailSchema);

export const moneySchema = z.coerce
  .number({ invalid_type_error: 'Precisa ser um número' })
  .refine(v => Number.isFinite(v), 'Precisa ser um número')
  .refine(v => Math.round(v * 100) === v * 100, 'No máximo 2 casas decimais');

/** ISO8601 datetime-local (input HTML <input type="datetime-local">). */
export const isoDateTimeSchema = z
  .string()
  .min(1, 'Campo obrigatório')
  .refine(v => !Number.isNaN(Date.parse(v)), 'Data/horário inválido');

/** Versão opcional (update): em branco vira `null`. */
export const optionalIsoDateTimeSchema = optionalNullable(isoDateTimeSchema);

/**
 * Gera o schema de ATUALIZAÇÃO a partir do schema de CRIAÇÃO de um recurso.
 *
 * No backend, todo `Update<Entity>Dto` é gerado com `PartialType(Create...)`
 * do `@nestjs/mapped-types` — isso envolve TODO campo em `@IsOptional()`,
 * inclusive os que eram obrigatórios na criação (nome, telefone etc.).
 * `@IsOptional()` só pula a validação para `null`/`undefined`; string vazia
 * ainda cai nos validadores de tamanho/formato e é rejeitada.
 *
 * Portanto, o schema de update não pode ser só `createSchema.partial()`
 * (que só torna a CHAVE opcional) — cada campo individualmente precisa
 * aceitar "" -> null. Esta função aplica `optionalNullable` recursivamente
 * em cada campo do schema de criação (inclusive objetos aninhados), então
 * qualquer campo pode ser deixado em branco no formulário de edição sem
 * disparar "campo não pode estar vazio" — vira `null`, que o service do
 * backend trata como "não alterar este campo" (padrão `dto.x ?? atual.x`).
 */
export function toUpdateSchema<Shape extends z.ZodRawShape>(schema: z.ZodObject<Shape>) {
  const shape = schema.shape as Record<string, ZodTypeAny>;
  const nextShape: Record<string, ZodTypeAny> = {};

  for (const key of Object.keys(shape)) {
    const fieldSchema = shape[key];
    nextShape[key] =
      fieldSchema instanceof z.ZodObject
        ? optionalNullable(toUpdateSchema(fieldSchema))
        : optionalNullable(fieldSchema);
  }

  return z.object(nextShape);
}

