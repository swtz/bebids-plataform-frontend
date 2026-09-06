import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { voucherApi } from '@/api/voucher.api';
import { endpoints } from '@/api/endpoints';
import type { QueryParams } from '@/lib/apiClient';
import type { CreateVoucherInput, UpdateVoucherInput } from '@/schemas/voucher.schema';

const key = endpoints.voucher.base;

export function useVouchers(params?: QueryParams) {
  return useQuery({
    queryKey: [key, 'list', params],
    queryFn: () => voucherApi.findAll(params),
  });
}

export function useMyVouchers() {
  return useQuery({
    queryKey: [key, 'me'],
    queryFn: voucherApi.findAllOwned,
  });
}

export function useCreateVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateVoucherInput) => voucherApi.create(dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}

export function useCreateVoucherForUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, dto }: { userId: string; dto: CreateVoucherInput }) =>
      voucherApi.createForUser(userId, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}

/** PATCH /voucher/me/:id — edita um vale que pertence a você mesmo. */
export function useUpdateVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ voucherId, dto }: { voucherId: string; dto: UpdateVoucherInput }) =>
      voucherApi.update(voucherId, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}

/** PATCH /voucher/me/user/:userId — edita o vale de outro usuário (ex.: admin). */
export function useUpdateVoucherForUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      voucherId,
      dto,
    }: {
      userId: string;
      voucherId: string;
      dto: UpdateVoucherInput;
    }) => voucherApi.updateForUser(userId, { ...dto, id: voucherId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}

export function useRemoveVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => voucherApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}
