import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addressApi } from '@/api/address.api';
import { endpoints } from '@/api/endpoints';
import type { QueryParams } from '@/lib/apiClient';
import type { UpdateAddressInput } from '@/schemas/address.schema';

const key = endpoints.address.base;

export function useAddresses(params?: QueryParams) {
  return useQuery({
    queryKey: [key, 'list', params],
    queryFn: () => addressApi.findAll(params),
  });
}

export function useAddress(id: string | undefined) {
  return useQuery({
    queryKey: [key, id],
    queryFn: () => addressApi.findOne(id as string),
    enabled: Boolean(id),
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAddressInput }) =>
      addressApi.update(id, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}

export function useRemoveAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => addressApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}
