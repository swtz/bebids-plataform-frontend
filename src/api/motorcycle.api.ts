import { apiClient, QueryParams } from '@/lib/apiClient';
import { endpoints } from './endpoints';
import type { CreateMotorcycleInput, Motorcycle } from '@/schemas/motorcycle.schema';

export const motorcycleApi = {
  findAll: (params?: QueryParams) =>
    apiClient.get<Motorcycle[]>(endpoints.motorcycle.base, params),
  findOne: (id: string) => apiClient.get<Motorcycle>(endpoints.motorcycle.byId(id)),
  create: (dto: CreateMotorcycleInput) =>
    apiClient.post<Motorcycle>(endpoints.motorcycle.base, dto),
  // Sem `update()` de propósito: o backend não tem `PATCH /motorcycle/:id`
  // (ver `useUpdateMotorcycle` em useMotorcycleQueries.ts, que usa a rota
  // real via `deliveryManApi.updateRestrictMotorcycle`).
  remove: (id: string) => apiClient.delete<Motorcycle>(endpoints.motorcycle.byId(id)),
};
