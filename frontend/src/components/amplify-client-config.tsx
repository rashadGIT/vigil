'use client';

import { configureAmplify } from '@/lib/auth/amplify-config';

// Clear stale Amplify OAuth state before configuring so Amplify doesn't
// throw "redirect is coming from a different origin" on initialization when
// it finds inflight state stored from a previous cross-origin attempt.
if (typeof window !== 'undefined') {
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? '';
  const prefix = `CognitoIdentityServiceProvider.${clientId}`;
  localStorage.removeItem(`${prefix}.inflightOAuth`);
  localStorage.removeItem(`${prefix}.oauthState`);
  localStorage.removeItem(`${prefix}.oauthPKCE`);
}

configureAmplify();

export function AmplifyClientConfig() {
  return null;
}
