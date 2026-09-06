import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { workTimeApi, workTimePlaceApi } from '@/api/workTime.api';
import { endpoints } from '@/api/endpoints';
import type { QueryParams } from '@/lib/apiClient';
import type { CreateWorkTimeInput, UpdateWorkTimeInput } from '@/schemas/workTime.schema';

const key = endpoints.workTime.base;
const placeKey = endpoints.workTimePlace.base;

export function useWorkTimes(params?: QueryParams) {
  return useQuery({
    queryKey: [key, 'list', params],
    queryFn: () => workTimeApi.findAll(params),
  });
}

export function useMyWorkTime() {
  return useQuery({
    queryKey: [key, 'me'],
    queryFn: workTimeApi.findMy,
  });
}

export function useWorkTime(id: string | undefined) {
  return useQuery({
    queryKey: [key, id],
    queryFn: () => workTimeApi.findOne(id as string),
    enabled: Boolean(id),
  });
}

export function useWorkTimesOfPlace(placeId?: string) {
  return useQuery({
    queryKey: [placeKey, 'list', placeId],
    queryFn: () => workTimePlaceApi.findAllOfPlace(placeId),
  });
}

export function useWorkTimePlaceDateRange(
  params: { from: string; to: string },
  enabled: boolean,
) {
  return useQuery({
    queryKey: [placeKey, 'date', params],
    queryFn: () => workTimePlaceApi.getDateRange(params.from, params.to),
    enabled,
  });
}

export function useUpdateWorkTime() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateWorkTimeInput }) =>
      workTimeApi.update(id, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}

export function useAddWorkTimeToPlace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ placeId, dto }: { placeId: string; dto: CreateWorkTimeInput }) =>
      workTimePlaceApi.addToPlace(placeId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [placeKey] });
      queryClient.invalidateQueries({ queryKey: [endpoints.place.base] });
    },
  });
}

/** PATCH /work-time-place/me/:id — aqui :id é o id do WorkTime compartilhado. */
export function useUpdateSharedWorkTime() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workTimeId, dto }: { workTimeId: string; dto: UpdateWorkTimeInput }) =>
      workTimePlaceApi.updateShared(workTimeId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [placeKey] });
      queryClient.invalidateQueries({ queryKey: [key] });
    },
  });
}

/** DELETE /work-time-place/me/:id — idem, :id é o id do WorkTime compartilhado. */
export function useRemoveSharedWorkTime() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workTimeId: string) => workTimePlaceApi.removeShared(workTimeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [placeKey] });
      queryClient.invalidateQueries({ queryKey: [key] });
    },
  });
}

export function useRemoveWorkTime() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workTimeApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}
