import { apiClient, QueryParams } from '@/lib/apiClient';
import { endpoints } from './endpoints';
import type { CreateSettlementInput, Settlement } from '@/schemas/settlement.schema';

export const settlementApi = {
  findAll: (params?: QueryParams) => apiClient.get<Settlement[]>(endpoints.settlement.base, params),
  findAllOwned: (params?: QueryParams) => apiClient.get<Settlement[]>(endpoints.settlement.me, params),
  findOne: (id: string) => apiClient.get<Settlement>(endpoints.settlement.byId(id)),
  preview: (params: QueryParams) => apiClient.get<Settlement>(endpoints.settlement.preview, params),
  create: (dto: CreateSettlementInput) =>
    apiClient.post<Settlement>(endpoints.settlement.base, dto),
  update: (id: string, to: string, description?: string) =>
    apiClient.patch<Settlement>(endpoints.settlement.byId(id), { to, description }),
  updateCode: (id: string, placeCode: string) =>
    apiClient.patch<Settlement>(endpoints.settlement.code(id), { placeCode }),
  updateIsClosed: (id: string, flag: boolean) =>
    apiClient.patch<Settlement>(endpoints.settlement.flag(id, flag)),
  remove: (id: string) => apiClient.delete<Settlement>(endpoints.settlement.byId(id)),
};
