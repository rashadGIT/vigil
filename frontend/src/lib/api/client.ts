import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true';
const DEV_TENANT_ID = process.env.NEXT_PUBLIC_DEV_TENANT_ID ?? 'seed-tenant-id';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: inject auth headers
apiClient.interceptors.request.use(async (config) => {
  if (DEV_BYPASS) {
    // Local dev: bypass Cognito, inject mock user header for CognitoAuthGuard
    config.headers['x-dev-user'] = `dev-admin|${DEV_TENANT_ID}|admin|director@sunrise.demo`;
    config.headers['Authorization'] = 'Bearer dev-bypass-token';
    return config;
  }
  // Production: Amplify manages Cognito token lifecycle (auto-refresh)
  const session = await fetchAuthSession();
  const token = session.tokens?.accessToken?.toString();
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// Response interceptor: handle 401 with one token refresh attempt
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (!DEV_BYPASS && error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const session = await fetchAuthSession({ forceRefresh: true });
      const token = session.tokens?.accessToken?.toString();
      if (token) error.config.headers['Authorization'] = `Bearer ${token}`;
      return apiClient(error.config);
    }
    return Promise.reject(error);
  },
);
