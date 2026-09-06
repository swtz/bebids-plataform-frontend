import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/api/auth.api';
import type { LoginPayload } from '@/schemas/auth.schema';

export function useLogin() {
  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
  });
}
