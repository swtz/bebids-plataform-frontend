import { apiClient } from '@/lib/apiClient';
import { endpoints } from './endpoints';
import type {
  CreateDeliveryManInput,
  CreateDeliveryManWithExistingMotorcycleInput,
  DeliveryMan,
  UpdateDeliveryManInput,
} from '@/schemas/deliveryMan.schema';
import type { User } from '@/schemas/user.schema';
import type { UpdateMotorcycleInput, Motorcycle } from '@/schemas/motorcycle.schema';

export const deliveryManApi = {
  findAll: () => apiClient.get<DeliveryMan[]>(endpoints.motoboy.base),
  findOne: (id: string) => apiClient.get<DeliveryMan>(endpoints.motoboy.byId(id)),

  /** Cria motoboy junto com usuário + motocicleta nova. */
  create: (dto: CreateDeliveryManInput) =>
    apiClient.post<User>(endpoints.motoboy.base, dto),

  /** Cria motoboy reaproveitando uma motocicleta já cadastrada. */
  createWithExistingMotorcycle: (
    dto: CreateDeliveryManWithExistingMotorcycleInput,
  ) =>
    apiClient.post<User>(
      endpoints.motoboy.createWithMotorcycle(dto.motorcycleId),
      { user: dto.user, deliveryMan: dto.deliveryMan },
    ),

  updateMeMotorcycle: (dto: UpdateMotorcycleInput) =>
    apiClient.patch<DeliveryMan>(endpoints.motoboy.meMotorcycle, {
      motorcycle: dto,
    }),

  updateRestrictMotorcycle: (id: string, dto: UpdateMotorcycleInput) =>
    apiClient.patch<Motorcycle>(endpoints.motoboy.restrictMotorcycle(id), {
      motorcycle: dto,
    }),

  update: (id: string, dto: UpdateDeliveryManInput) =>
    apiClient.patch<DeliveryMan>(endpoints.motoboy.byId(id), {
      motorcycle: dto.motorcycle,
      daily: dto.daily,
    }),
};
