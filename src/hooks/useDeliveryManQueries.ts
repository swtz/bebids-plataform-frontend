import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deliveryManApi } from '@/api/deliveryMan.api';
import { endpoints } from '@/api/endpoints';
import type {
  CreateDeliveryManInput,
  CreateDeliveryManWithExistingMotorcycleInput,
  UpdateDeliveryManInput,
} from '@/schemas/deliveryMan.schema';

const key = endpoints.motoboy.base;

export function useDeliveryMen() {
  return useQuery({
    queryKey: [key, 'list'],
    queryFn: deliveryManApi.findAll,
  });
}

export function useDeliveryMan(id: string | undefined) {
  return useQuery({
    queryKey: [key, id],
    queryFn: () => deliveryManApi.findOne(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateDeliveryMan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateDeliveryManInput) => deliveryManApi.create(dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}

export function useCreateDeliveryManWithExistingMotorcycle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateDeliveryManWithExistingMotorcycleInput) =>
      deliveryManApi.createWithExistingMotorcycle(dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}

/** PATCH /motoboy/:id — atualiza a moto vinculada e/ou a diária. */
export function useUpdateDeliveryMan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateDeliveryManInput }) =>
      deliveryManApi.update(id, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}
