import { Amplify } from 'aws-amplify';

// Called once at app startup in root layout.tsx
// No-ops when NEXT_PUBLIC_DEV_AUTH_BYPASS=true (Cognito is never contacted)
export function configureAmplify() {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ?? '',
        userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? '',
        loginWith: { email: true },
      },
    },
  });
}
