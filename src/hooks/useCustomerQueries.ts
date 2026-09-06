import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '@/api/customer.api';
import { endpoints } from '@/api/endpoints';
import type {
  CreateCustomerWithAddressInput,
  UpdateCustomerInput,
} from '@/schemas/customer.schema';
import type { CreateAddressInput } from '@/schemas/address.schema';

const key = endpoints.customer.base;

export function useCustomers() {
  return useQuery({
    queryKey: [key, 'list'],
    queryFn: customerApi.findAll,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCustomerWithAddressInput) => customerApi.create(dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCustomerInput }) =>
      customerApi.update(id, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}

export function useRemoveCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customerApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}

export function useAddCustomerAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId, dto }: { customerId: string; dto: CreateAddressInput }) =>
      customerApi.addAddress(customerId, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}

export function useRemoveCustomerAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (addressId: string) => customerApi.removeAddress(addressId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}
