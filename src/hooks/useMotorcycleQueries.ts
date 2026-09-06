import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motorcycleApi } from '@/api/motorcycle.api';
import { deliveryManApi } from '@/api/deliveryMan.api';
import { endpoints } from '@/api/endpoints';
import type { QueryParams } from '@/lib/apiClient';
import type { CreateMotorcycleInput, UpdateMotorcycleInput } from '@/schemas/motorcycle.schema';

const key = endpoints.motorcycle.base;

export function useMotorcycles(params?: QueryParams) {
  return useQuery({
    queryKey: [key, 'list', params],
    queryFn: () => motorcycleApi.findAll(params),
  });
}

export function useMotorcycle(id: string | undefined) {
  return useQuery({
    queryKey: [key, id],
    queryFn: () => motorcycleApi.findOne(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateMotorcycle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateMotorcycleInput) => motorcycleApi.create(dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}

/**
 * IMPORTANTE: o backend não tem `PATCH /motorcycle/:id` (o
 * `MotorcycleController` só expõe POST/GET/DELETE) — editar os campos de
 * uma moto isolada só é possível via `PATCH /motoboy/motorcycle/restrict/:id`
 * (admin), no controller de Motoboy. Por isso este hook chama
 * `deliveryManApi`, não `motorcycleApi`, mesmo sendo usado na tela de
 * Motocicletas.
 */
export function useUpdateMotorcycle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateMotorcycleInput }) =>
      deliveryManApi.updateRestrictMotorcycle(id, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}

export function useRemoveMotorcycle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => motorcycleApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}
