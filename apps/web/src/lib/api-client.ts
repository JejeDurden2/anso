import type { ApiResponse, ApiErrorResponse } from '@anso/types';

const API_BASE_URL = '/api';

class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
  skipRefresh?: boolean;
}

let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

async function refreshToken(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new ApiError('REFRESH_FAILED', 'Failed to refresh token', response.status);
  }
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { params, skipRefresh, ...fetchOptions } = options;

  let url = `${API_BASE_URL}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });
    url += `?${searchParams.toString()}`;
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
    credentials: 'include',
  });

  // Handle 401 Unauthorized - try to refresh token
  if (response.status === 401 && !skipRefresh && !endpoint.includes('/auth/')) {
    // If already refreshing, wait for it
    if (isRefreshing && refreshPromise) {
      await refreshPromise;
      // Retry the original request
      return request<T>(endpoint, { ...options, skipRefresh: true });
    }

    // Start refresh process
    isRefreshing = true;
    refreshPromise = refreshToken();

    try {
      await refreshPromise;
      isRefreshing = false;
      refreshPromise = null;
      // Retry the original request
      return request<T>(endpoint, { ...options, skipRefresh: true });
    } catch {
      isRefreshing = false;
      refreshPromise = null;
      // Refresh failed, redirect to login
      window.location.href = '/login';
      throw new ApiError('UNAUTHORIZED', 'Session expired', 401);
    }
  }

  const data = await response.json();

  if (!response.ok) {
    const errorData = data as ApiErrorResponse;
    throw new ApiError(
      errorData.error.code,
      errorData.error.message,
      response.status,
      errorData.error.details
    );
  }

  return data as ApiResponse<T>;
}

export const apiClient = {
  get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return request<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return request<T>(endpoint, { ...options, method: 'DELETE' });
  },

  async upload<T>(endpoint: string, file: File, fieldName = 'file'): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append(fieldName, file);

    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as ApiErrorResponse;
      throw new ApiError(
        errorData.error.code,
        errorData.error.message,
        response.status,
        errorData.error.details
      );
    }

    return data as ApiResponse<T>;
  },
};

export { ApiError };
