import { apiClient } from '@/lib/apiClient';
import { endpoints } from './endpoints';
import type { LoginPayload } from '@/schemas/auth.schema';

export interface LoginResponse {
  accessToken: string;
}

export const authApi = {
  login: (payload: LoginPayload) =>
    apiClient.post<LoginResponse>(endpoints.auth.login, payload),
};
