import { apiClient, QueryParams } from '@/lib/apiClient';
import { endpoints } from './endpoints';
import type {
  CreateDeliveryInput,
  Delivery,
  UpdateDeliveryInput,
} from '@/schemas/delivery.schema';

export const deliveryApi = {
  findAll: (params?: QueryParams) => apiClient.get<Delivery[]>(endpoints.delivery.base, params),
  findAllOwned: () => apiClient.get<Delivery[]>(endpoints.delivery.me),
  findOne: (id: string) => apiClient.get<Delivery>(endpoints.delivery.byId(id)),
  create: (dto: CreateDeliveryInput) => apiClient.post<Delivery>(endpoints.delivery.me, dto),
  update: (id: string, dto: UpdateDeliveryInput) =>
    apiClient.patch<Delivery>(endpoints.delivery.meById(id), dto),
  remove: (id: string) => apiClient.delete<Delivery>(endpoints.delivery.meById(id)),
};
