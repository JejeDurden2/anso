import type { AuthUser } from '@anso/types';

import { apiClient, ApiError } from '@/lib/api-client';

export const authService = {
  async getCurrentUser(): Promise<AuthUser> {
    const response = await apiClient.get<AuthUser>('/auth/me');
    return response.data;
  },

  async refreshToken(): Promise<void> {
    await apiClient.post('/auth/refresh');
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  getGoogleAuthUrl(): string {
    return '/api/auth/google';
  },
};

export { ApiError };
