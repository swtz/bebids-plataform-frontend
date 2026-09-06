import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { intervalTimeApi, IntervalTimeFilters } from '@/api/intervalTime.api';
import { endpoints } from '@/api/endpoints';
import type { CreateIntervalTimeInput, UpdateIntervalTimeInput } from '@/schemas/intervalTime.schema';

const key = endpoints.intervalTime.base;

export function useIntervalTimes(params?: IntervalTimeFilters) {
  return useQuery({
    queryKey: [key, 'list', params],
    queryFn: () => intervalTimeApi.findAll(params),
  });
}

export function useMyIntervalTime() {
  return useQuery({
    queryKey: [key, 'me'],
    queryFn: intervalTimeApi.findMy,
  });
}

export function useIntervalTime(id: string | undefined) {
  return useQuery({
    queryKey: [key, id],
    queryFn: () => intervalTimeApi.findOne(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateIntervalTimeForMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateIntervalTimeInput) => intervalTimeApi.createForMe(dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}

export function useCreateIntervalTimeForEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, dto }: { userId: string; dto: CreateIntervalTimeInput }) =>
      intervalTimeApi.createForEntity(userId, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}

export function useUpdateIntervalTime() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateIntervalTimeInput }) =>
      intervalTimeApi.update(id, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}

export function useRemoveIntervalTime() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => intervalTimeApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}
