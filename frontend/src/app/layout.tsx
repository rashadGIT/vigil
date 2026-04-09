import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { configureAmplify } from '@/lib/auth/amplify-config';
import { QueryProvider } from '@/providers/query-provider';
import { PwaRegister } from '@/components/pwa-register';
import './globals.css';

// Configure Amplify once at module level (safe in Server Component context)
configureAmplify();

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Vigil — Funeral Home Operations',
  description: 'Multi-tenant funeral operations platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1a1a2e" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={inter.className}>
        <QueryProvider>
          {children}
          <Toaster position="bottom-right" richColors closeButton />
          <PwaRegister />
        </QueryProvider>
      </body>
    </html>
  );
}
