import { apiClient, QueryParams } from '@/lib/apiClient';
import { endpoints } from './endpoints';
import type {
  CreateWorkTimeInput,
  UpdateWorkTimeInput,
  WorkTime,
} from '@/schemas/workTime.schema';
import type { Place } from '@/schemas/place.schema';
import type { User } from '@/schemas/user.schema';

export const workTimeApi = {
  findAll: (params?: QueryParams) => apiClient.get<WorkTime[]>(endpoints.workTime.base, params),
  findMy: () => apiClient.get<WorkTime>(endpoints.workTime.me),
  findOne: (id: string) => apiClient.get<WorkTime>(endpoints.workTime.byId(id)),
  update: (id: string, dto: UpdateWorkTimeInput) =>
    apiClient.patch<WorkTime>(endpoints.workTime.byId(id), dto),
  remove: (id: string) => apiClient.delete<WorkTime>(endpoints.workTime.byId(id)),
};

/** Rotas de work-time-place: horário de serviço compartilhado por estabelecimento. */
export const workTimePlaceApi = {
  findAllOfPlace: (placeId?: string) =>
    apiClient.get<WorkTime[]>(endpoints.workTimePlace.base, { id: placeId }),
  getDateRange: (from: string, to: string) =>
    apiClient.get<{ initDate: string; endDate: string }>(
      endpoints.workTimePlace.date,
      { from, to },
    ),
  addToPlace: (placeId: string, dto: CreateWorkTimeInput) =>
    apiClient.post<Place>(endpoints.workTimePlace.meById(placeId), dto),
  updateShared: (workTimeId: string, dto: UpdateWorkTimeInput) =>
    apiClient.patch<WorkTime>(endpoints.workTimePlace.meById(workTimeId), dto),
  removeShared: (workTimeId: string) =>
    apiClient.delete<WorkTime>(endpoints.workTimePlace.meById(workTimeId)),
};

/** Rotas de work-time-user: horário individual de um usuário. */
export const workTimeUserApi = {
  setToUser: (userId: string, dto: CreateWorkTimeInput) =>
    apiClient.put<User>(endpoints.workTimeUser.byId(userId), dto),
  setSharedToUser: (userId: string, workTimeId: string) =>
    apiClient.put<User>(endpoints.workTimeUser.shared(userId, workTimeId)),
};
