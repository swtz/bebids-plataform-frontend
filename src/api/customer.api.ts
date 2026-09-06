import { apiClient, type QueryParams } from '@/lib/apiClient';
import { endpoints } from './endpoints';
import type {
  Customer,
  CreateCustomerWithAddressInput,
  UpdateCustomerInput,
} from '@/schemas/customer.schema';
import type { Address, CreateAddressInput } from '@/schemas/address.schema';

export interface CustomerFindOneFilters {
  id?: string;
  nickname?: string;
  name?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export const customerApi = {
  findAll: () => apiClient.get<Customer[]>(endpoints.customer.base),
  findOneBy: (params: CustomerFindOneFilters) =>
    apiClient.get<Customer>(endpoints.customer.find, params as QueryParams),
  create: (dto: CreateCustomerWithAddressInput) =>
    apiClient.post<Customer>(endpoints.customer.base, dto),
  update: (id: string, dto: UpdateCustomerInput) =>
    apiClient.patch<Customer>(endpoints.customer.byId(id), dto),
  remove: (id: string) => apiClient.delete<Customer>(endpoints.customer.byId(id)),
  addAddress: (customerId: string, dto: CreateAddressInput) =>
    apiClient.post<Customer>(endpoints.customer.address(customerId), dto),
  removeAddress: (addressId: string) =>
    apiClient.delete<Address>(endpoints.customer.addressById(addressId)),
};
