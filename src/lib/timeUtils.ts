/**
 * O backend só usa a PARTE DA HORA do ISO8601 recebido — veja
 * `getTimeFromDateIsoString` no backend, que faz `date.slice(11, 19)`
 * (extrai exatamente "HH:mm:ss" de um `YYYY-MM-DDTHH:mm:ss`). A data em si
 * é descartada, então usamos uma data fixa de referência (a mesma que o
 * backend usa para calcular duração: 1970-01-01) para montar um ISO válido
 * a partir do que o usuário escolhe num <input type="time">.
 */
const REFERENCE_DATE = '1970-01-01';

/** "HH:mm" (do <input type="time">) -> ISO8601 completo. "" continua "". */
export function timeToIso(time: string): string {
  if (!time) return '';
  const withSeconds = time.length === 5 ? `${time}:00` : time;
  return `${REFERENCE_DATE}T${withSeconds}`;
}

/** ISO8601 completo (ou já um "HH:mm") -> "HH:mm" para exibir no input. */
export function isoToTime(iso: string | null | undefined): string {
  if (!iso) return '';
  if (iso.length <= 8) return iso.slice(0, 5);
  return iso.slice(11, 16);
}

/**
 * Payout/Settlement (`from`, `to`, e o `to` do refresh) passam pelo
 * `WorkTimeDateService.create` do backend, que só usa `date.slice(0, 10)`
 * de cada string — a hora é sempre a do horário de serviço do usuário
 * resolvido, nunca a que vier em `from`/`to`. Um "YYYY-MM-DD" puro (sem
 * hora) já passa em `isISO8601(..., { strict: true })`, então um
 * <input type="date"> pode ser enviado direto ao backend, sem conversão.
 */
export function todayAsDate(): string {
  return new Date().toISOString().slice(0, 10);
}
