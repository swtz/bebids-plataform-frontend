import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/api/user.api';
import { endpoints } from '@/api/endpoints';
import type { QueryParams } from '@/lib/apiClient';
import type { CreateUserInput, UpdateUserInput } from '@/schemas/user.schema';

const key = endpoints.user.base;

export function useUsers(params?: QueryParams) {
  return useQuery({
    queryKey: [key, 'list', params],
    queryFn: () => userApi.findAll(params),
  });
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: [key, id],
    queryFn: () => userApi.findOne(id as string),
    enabled: Boolean(id),
  });
}

export function useMe() {
  return useQuery({
    queryKey: [key, 'me'],
    queryFn: userApi.findMe,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateUserInput) => userApi.create(dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateUserInput }) =>
      userApi.update(id, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}

export function useRemoveUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}
