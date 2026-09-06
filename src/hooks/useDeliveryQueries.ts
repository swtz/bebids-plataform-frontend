import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deliveryApi } from '@/api/delivery.api';
import { endpoints } from '@/api/endpoints';
import type { QueryParams } from '@/lib/apiClient';
import type { CreateDeliveryInput, UpdateDeliveryInput } from '@/schemas/delivery.schema';

const key = endpoints.delivery.base;

export function useDeliveries(params?: QueryParams) {
  return useQuery({
    queryKey: [key, 'list', params],
    queryFn: () => deliveryApi.findAll(params),
  });
}

export function useMyDeliveries() {
  return useQuery({
    queryKey: [key, 'me'],
    queryFn: deliveryApi.findAllOwned,
  });
}

export function useDelivery(id: string | undefined) {
  return useQuery({
    queryKey: [key, id],
    queryFn: () => deliveryApi.findOne(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateDeliveryInput) => deliveryApi.create(dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}

export function useUpdateDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateDeliveryInput }) =>
      deliveryApi.update(id, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}

export function useRemoveDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deliveryApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}
