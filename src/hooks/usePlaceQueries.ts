import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { placeApi } from '@/api/place.api';
import { endpoints } from '@/api/endpoints';
import type { QueryParams } from '@/lib/apiClient';
import type { CreatePlaceInput, UpdatePlaceInput } from '@/schemas/place.schema';

const key = endpoints.place.base;

export function usePlaces(params?: QueryParams) {
  return useQuery({
    queryKey: [key, 'list', params],
    queryFn: () => placeApi.findAll(params),
  });
}

export function usePlace(id: string | undefined) {
  return useQuery({
    queryKey: [key, id],
    queryFn: () => placeApi.findOne(id as string),
    enabled: Boolean(id),
  });
}

export function useCreatePlace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePlaceInput) => placeApi.create(dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}

export function useUpdatePlace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePlaceInput }) =>
      placeApi.update(id, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}

export function useRemovePlace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => placeApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}
