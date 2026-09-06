/**
 * <input> não aceita `null`/`undefined` como value — usado ao pré-popular
 * um formulário de edição com dados vindos da API (onde campos opcionais
 * chegam como `null`). O schema Zod (optionalNullable) converte de volta
 * "" -> null na hora de enviar, então o ciclo fica: API (null) -> form ("")
 * -> submit (null de novo).
 */
export function toFormValue(value: string | number | null | undefined): string {
  return value === null || value === undefined ? '' : String(value);
}
