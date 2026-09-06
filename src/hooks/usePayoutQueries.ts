import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { payoutApi } from '@/api/payout.api';
import { endpoints } from '@/api/endpoints';
import type { QueryParams } from '@/lib/apiClient';
import type { CreatePayoutInput } from '@/schemas/payout.schema';

const key = endpoints.payout.base;

export function usePayouts(params?: QueryParams) {
  return useQuery({
    queryKey: [key, 'list', params],
    queryFn: () => payoutApi.findAll(params),
  });
}

export function useMyPayouts(params?: QueryParams) {
  return useQuery({
    queryKey: [key, 'me', params],
    queryFn: () => payoutApi.findAllOwned(params),
  });
}

export function usePayoutPreview(params: QueryParams, enabled: boolean) {
  return useQuery({
    queryKey: [key, 'preview', params],
    queryFn: () => payoutApi.preview(params),
    enabled,
  });
}

export function useCreatePayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePayoutInput) => payoutApi.create(dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}

export function useUpdatePayoutIsClosed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, flag }: { id: string; flag: boolean }) =>
      payoutApi.updateIsClosed(id, flag),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}

/** PATCH /payout/:id?to=<ISO> — recalcula o pagamento com dados atuais. */
export function useRefreshPayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, to }: { id: string; to: string }) => payoutApi.update(id, to),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}

export function useRemovePayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => payoutApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}
