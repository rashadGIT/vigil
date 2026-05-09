import axios from 'axios';
import { useAuthStore } from '@/lib/store/auth.store';

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true';
const DEV_TENANT_ID = process.env.NEXT_PUBLIC_DEV_TENANT_ID ?? 'seed-tenant-id';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: inject auth headers
apiClient.interceptors.request.use((config) => {
  if (DEV_BYPASS) {
    config.headers['x-dev-user'] = `dev-admin|${DEV_TENANT_ID}|admin|director@sunrise.demo`;
    config.headers['Authorization'] = 'Bearer dev-bypass-token';
    return config;
  }
  // Read from in-memory store first; fall back to persisted localStorage value
  // to handle the case where the store hasn't rehydrated yet on first render
  let token = useAuthStore.getState().accessToken;
  if (!token && typeof window !== 'undefined') {
    try {
      const persisted = JSON.parse(localStorage.getItem('vigil-auth') ?? '{}');
      token = persisted?.state?.accessToken ?? null;
    } catch { /* ignore parse errors */ }
  }
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// Response interceptor: surface 401s clearly
apiClient.interceptors.response.use(
  (res) => res,
  (error) => Promise.reject(error),
);
