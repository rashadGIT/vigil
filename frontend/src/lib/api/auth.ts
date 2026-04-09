import { signIn, signOut, fetchAuthSession } from 'aws-amplify/auth';
import { apiClient } from './client';

export interface LoginCredentials {
  email: string;
  password: string;
}

// DEV bypass: skip Cognito entirely, call backend /auth/login with dev header
// Production: use Amplify signIn which handles Cognito USER_PASSWORD_AUTH flow
export async function login(credentials: LoginCredentials) {
  const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true';

  if (DEV_BYPASS) {
    // Backend CognitoAuthGuard will parse x-dev-user header injected by apiClient interceptor
    const res = await apiClient.post<{ user: { id: string; email: string; name: string; role: string; tenantId: string } }>(
      '/auth/profile',
    );
    return res.data.user;
  }

  // Production: Amplify handles Cognito sign-in + sets tokens in memory
  await signIn({ username: credentials.email, password: credentials.password });
  const session = await fetchAuthSession();
  const idToken = session.tokens?.idToken?.payload;

  return {
    id: idToken?.sub as string,
    email: credentials.email,
    name: (idToken?.name as string) ?? credentials.email,
    role: (idToken?.['custom:role'] as string) ?? 'staff',
    tenantId: idToken?.['custom:tenantId'] as string,
  };
}

export async function logout() {
  const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true';
  if (!DEV_BYPASS) {
    await signOut();
  }
  // Clear the httpOnly access_token cookie via backend endpoint
  await apiClient.post('/auth/logout').catch(() => null);
}
