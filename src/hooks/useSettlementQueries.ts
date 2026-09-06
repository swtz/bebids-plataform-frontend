import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settlementApi } from '@/api/settlement.api';
import { endpoints } from '@/api/endpoints';
import type { QueryParams } from '@/lib/apiClient';
import type { CreateSettlementInput } from '@/schemas/settlement.schema';

const key = endpoints.settlement.base;

export function useSettlements(params?: QueryParams) {
  return useQuery({
    queryKey: [key, 'list', params],
    queryFn: () => settlementApi.findAll(params),
  });
}

export function useMySettlements(params?: QueryParams) {
  return useQuery({
    queryKey: [key, 'me', params],
    queryFn: () => settlementApi.findAllOwned(params),
  });
}

export function useSettlementPreview(params: QueryParams, enabled: boolean) {
  return useQuery({
    queryKey: [key, 'preview', params],
    queryFn: () => settlementApi.preview(params),
    enabled,
  });
}

export function useCreateSettlement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSettlementInput) => settlementApi.create(dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}

export function useUpdateSettlementIsClosed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, flag }: { id: string; flag: boolean }) =>
      settlementApi.updateIsClosed(id, flag),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}

/** PATCH /settlement/:id — recalcula o caixa com dados atuais (to + descrição opcional). */
export function useRefreshSettlement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, to, description }: { id: string; to: string; description?: string }) =>
      settlementApi.update(id, to, description),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}

export function useRemoveSettlement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => settlementApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}
