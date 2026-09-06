import { apiClient, QueryParams } from '@/lib/apiClient';
import { endpoints } from './endpoints';
import type { Address, UpdateAddressInput } from '@/schemas/address.schema';

export const addressApi = {
  findAll: (params?: QueryParams) => apiClient.get<Address[]>(endpoints.address.base, params),
  findOne: (id: string) => apiClient.get<Address>(endpoints.address.byId(id)),
  update: (id: string, dto: UpdateAddressInput) =>
    apiClient.patch<Address>(endpoints.address.byId(id), dto),
  remove: (id: string) => apiClient.delete<Address>(endpoints.address.byId(id)),
};
