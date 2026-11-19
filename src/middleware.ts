import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';

// Every page of the app needs an account; public portfolios (/portfolio/...) do not
const protectedRoutes = [
    '/dashboard', '/onboarding', '/connect', '/generate', '/projects', '/experience', '/skills',
    '/customize', '/preview', '/deploy', '/settings', '/help',
];
const authRoutes = ['/login', '/signup'];

const matches = (pathname: string, routes: string[]) =>
    routes.some(route => pathname === route || pathname.startsWith(`${route}/`));

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get('auth-token')?.value;
    const isValidToken = token ? !!(await verifyJWT(token)) : false;

    // The app starts at sign-in: signed-in users go to their dashboard, everyone else to login
    if (pathname === '/') {
        return NextResponse.redirect(new URL(isValidToken ? '/dashboard' : '/login', request.url));
    }

    if (matches(pathname, protectedRoutes) && !isValidToken) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    if (matches(pathname, authRoutes) && isValidToken) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    // Pages only: API routes and static files check auth themselves / need none
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
    ],
};
