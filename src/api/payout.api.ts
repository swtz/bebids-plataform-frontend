import { apiClient, QueryParams } from '@/lib/apiClient';
import { endpoints } from './endpoints';
import type { CreatePayoutInput, Payout } from '@/schemas/payout.schema';

export const payoutApi = {
  findAll: (params?: QueryParams) => apiClient.get<Payout[]>(endpoints.payout.base, params),
  findAllOwned: (params?: QueryParams) => apiClient.get<Payout[]>(endpoints.payout.me, params),
  findOne: (id: string) => apiClient.get<Payout>(endpoints.payout.byId(id)),
  preview: (params: QueryParams) => apiClient.get<Payout>(endpoints.payout.preview, params),
  create: (dto: CreatePayoutInput) => apiClient.post<Payout>(endpoints.payout.base, dto),
  update: (id: string, to: string) =>
    apiClient.patch<Payout>(endpoints.payout.byId(id), undefined, { to }),
  updateCode: (id: string, placeCode: string) =>
    apiClient.patch<Payout>(endpoints.payout.code(id), { placeCode }),
  updateIsClosed: (id: string, flag: boolean) =>
    apiClient.patch<Payout>(endpoints.payout.flag(id, flag)),
  remove: (id: string) => apiClient.delete<Payout>(endpoints.payout.byId(id)),
};
