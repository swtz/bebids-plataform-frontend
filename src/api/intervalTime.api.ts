import { apiClient, type QueryParams } from '@/lib/apiClient';
import { endpoints } from './endpoints';
import type {
  CreateIntervalTimeInput,
  IntervalTime,
  UpdateIntervalTimeInput,
} from '@/schemas/intervalTime.schema';

export interface IntervalTimeFilters {
  workTimeId?: string;
  userId?: string;
  duration?: string;
  field?: 'createdAt' | 'updatedAt' | 'initHour' | 'endHour' | 'duration';
  order?: 'asc' | 'desc';
}

export const intervalTimeApi = {
  findAll: (params?: IntervalTimeFilters) =>
    apiClient.get<IntervalTime[]>(endpoints.intervalTime.base, params as QueryParams | undefined),
  findMy: () => apiClient.get<IntervalTime>(endpoints.intervalTime.me),
  findOne: (id: string) => apiClient.get<IntervalTime>(endpoints.intervalTime.byId(id)),
  update: (id: string, dto: UpdateIntervalTimeInput) =>
    apiClient.patch<IntervalTime>(endpoints.intervalTime.byId(id), dto),
  remove: (id: string) => apiClient.delete<IntervalTime>(endpoints.intervalTime.byId(id)),

  /** Criação ocorre via work-time-user (ver workTimeUserApi.createIntervalTime*). */
  createForMe: (dto: CreateIntervalTimeInput) =>
    apiClient.post<IntervalTime>(endpoints.workTimeUser.meIntervalTime, dto),
  createForEntity: (userId: string, dto: CreateIntervalTimeInput) =>
    apiClient.post<IntervalTime>(
      endpoints.workTimeUser.intervalTimeForEntity(userId),
      dto,
    ),
};
