import { NextRequest, NextResponse } from 'next/server';

const DASHBOARD_PATHS = ['/', '/cases', '/calendar', '/vendors', '/price-list', '/settings'];
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'vigilhq.com';
const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') ?? '';

  // Subdomain tenant resolution
  // Production: sunrise.vigilhq.com → slug = 'sunrise'
  // Local dev:  localhost:3000?tenant=sunrise → slug = 'sunrise'
  const subdomain = host.replace(`.${APP_DOMAIN}`, '').replace(/:\d+$/, '');
  const isSubdomain =
    subdomain !== 'app' &&
    subdomain !== 'www' &&
    subdomain !== 'localhost' &&
    host.includes(APP_DOMAIN);
  const tenantSlug = isSubdomain
    ? subdomain
    : request.nextUrl.searchParams.get('tenant') ?? null;

  const requestHeaders = new Headers(request.headers);
  if (tenantSlug) requestHeaders.set('x-tenant-slug', tenantSlug);

  // Dashboard auth guard
  const isDashboardRoute = DASHBOARD_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
  if (isDashboardRoute) {
    const accessToken = request.cookies.get('access_token')?.value;

    // DEV bypass: allow through without a real token
    if (!accessToken && !DEV_BYPASS) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // If bypass active but visiting /login, redirect to dashboard
    if (DEV_BYPASS && pathname === '/login') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
