import { apiClient } from '@/lib/apiClient';
import { endpoints } from './endpoints';

export const tipApi = {
  remove: (id: string) => apiClient.delete<{ id: string }>(endpoints.tip.byId(id)),
};
