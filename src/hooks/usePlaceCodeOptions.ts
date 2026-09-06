import { useMemo } from 'react';
import { usePlaces } from './usePlaceQueries';

/**
 * Opções de dropdown para qualquer campo `placeCode`. Confirmado no backend
 * (`ParsePlaceCodePipe`, aplicado em TODO DTO que tem esse campo — User,
 * Motorcycle, Motoboy, Delivery, Payout, Settlement) que o valor esperado é
 * o CNPJ (ou CPF) do estabelecimento — não o `Place.code` nem o `Place.id`.
 * Por isso o `value` de cada opção aqui é `place.cnpj`.
 */
export function usePlaceCodeOptions() {
  const { data } = usePlaces();
  return useMemo(
    () =>
      (data ?? []).map(p => ({
        value: p.cnpj,
        label: `${p.name} — ${p.cnpj}`,
      })),
    [data],
  );
}
