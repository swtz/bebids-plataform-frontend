import { apiClient, QueryParams } from '@/lib/apiClient';
import { endpoints } from './endpoints';
import type { CreateVoucherInput, UpdateVoucherInput, Voucher } from '@/schemas/voucher.schema';

export const voucherApi = {
  findAll: (params?: QueryParams) => apiClient.get<Voucher[]>(endpoints.voucher.base, params),
  findAllOwned: () => apiClient.get<Voucher[]>(endpoints.voucher.me),
  findOne: (id: string) => apiClient.get<Voucher>(endpoints.voucher.byId(id)),
  create: (dto: CreateVoucherInput) => apiClient.post<Voucher>(endpoints.voucher.me, dto),
  createForUser: (userId: string, dto: CreateVoucherInput) =>
    apiClient.post<Voucher>(endpoints.voucher.meForUser(userId), dto),
  /** PATCH /voucher/me/:id — só funciona para adiantamentos que pertencem a você mesmo. */
  update: (voucherId: string, dto: UpdateVoucherInput) =>
    apiClient.patch<Voucher>(endpoints.voucher.meById(voucherId), dto),
  /**
   * PATCH /voucher/me/user/:userId — para editar o vale de OUTRO usuário
   * (ex.: admin editando o vale de um motoboy). `userId` é o dono do vale
   * (vai na rota); `dto.id` precisa ser o id do próprio vale (vai no corpo).
   */
  updateForUser: (userId: string, dto: UpdateVoucherInput & { id: string }) =>
    apiClient.patch<Voucher>(endpoints.voucher.meForUserById(userId), dto),
  remove: (id: string) => apiClient.delete<Voucher>(endpoints.voucher.meById(id)),
};
