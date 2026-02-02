import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export default async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow access to login page, register page, auth API routes, and static files
    if (
        pathname.startsWith('/login') ||
        pathname.startsWith('/register') ||
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/api/search') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    // Check for session
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    // Also check cookie for email login
    const hasLocalAuth = request.cookies.get('streamflow_auth');

    if (!token && !hasLocalAuth) {
        // Redirect to login
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
