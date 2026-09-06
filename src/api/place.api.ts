import { apiClient, QueryParams } from '@/lib/apiClient';
import { endpoints } from './endpoints';
import type { CreatePlaceInput, Place, UpdatePlaceInput } from '@/schemas/place.schema';

export const placeApi = {
  findAll: (params?: QueryParams) => apiClient.get<Place[]>(endpoints.place.base, params),
  findOne: (id: string) => apiClient.get<Place>(endpoints.place.byId(id)),
  create: (dto: CreatePlaceInput) => apiClient.post<Place>(endpoints.place.createMe, dto),
  update: (id: string, dto: UpdatePlaceInput) =>
    apiClient.patch<Place>(endpoints.place.updateMeById(id), dto),
  updateCode: (id: string, code: string) =>
    apiClient.patch<Place>(endpoints.place.updateCode(id, code)),
  remove: (id: string) => apiClient.delete<Place>(endpoints.place.updateMeById(id)),
};
