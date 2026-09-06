import { apiClient, QueryParams } from '@/lib/apiClient';
import { endpoints } from './endpoints';
import type { CreateUserInput, UpdatePasswordInput, UpdateUserInput, User } from '@/schemas/user.schema';

export const userApi = {
  findMe: () => apiClient.get<User>(endpoints.user.me),
  findOne: (id: string) => apiClient.get<User>(endpoints.user.byId(id)),
  findAll: (params?: QueryParams) => apiClient.get<User[]>(endpoints.user.base, params),
  create: (dto: CreateUserInput) => apiClient.post<User>(endpoints.user.base, dto),
  updateMe: (dto: UpdateUserInput) => apiClient.patch<User>(endpoints.user.me, dto),
  update: (id: string, dto: UpdateUserInput) =>
    apiClient.patch<User>(endpoints.user.byId(id), dto),
  updatePassword: (dto: UpdatePasswordInput) =>
    apiClient.patch<User>(endpoints.user.mePassword, dto),
  remove: (id: string) => apiClient.delete<User>(endpoints.user.byId(id)),
};
