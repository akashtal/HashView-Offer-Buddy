import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key-offer-buddy-123';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Exclude public paths and static assets
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/static') ||
        pathname.startsWith('/api/auth') || // Login/Register APIs must be public
        pathname === '/login' ||
        pathname === '/register' ||
        pathname === '/' ||
        pathname === '/pricing' ||
        pathname.startsWith('/products') || // Public product view
        pathname.startsWith('/categories') || // Public categories
        pathname.startsWith('/offers') || // Public offers
        pathname.includes('favicon.ico')
    ) {
        return NextResponse.next();
    }

    // 2. Get token from cookie
    const token = request.cookies.get('token')?.value;

    // 3. Define protected routes patterns
    const isVendorRoute = pathname.startsWith('/vendor');
    const isAdminRoute = pathname.startsWith('/admin');
    const isProtectedApi = pathname.startsWith('/api') && !pathname.startsWith('/api/auth') && !pathname.startsWith('/api/public');

    // If no token and trying to access protected route
    if (!token) {
        if (isVendorRoute || isAdminRoute) {
            const url = new URL('/login', request.url);
            url.searchParams.set('from', pathname);
            return NextResponse.redirect(url);
        }
        // Allow public API reads (like GET /api/products) if we want, or block?
        // For now nextResponse.next() for unauthenticated API access might be risky unless handled in route.
        // But commonly APIs handle their own auth. Middleware provides a broad guard.
        // Let's protect /vendor dashboard pages strictly.
        return NextResponse.next();
    }

    // 4. Verify Token
    try {
        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const role = payload.role as string;

        // 5. Role-Based Access Control

        // Block 'user' from Vendor routes
        if (isVendorRoute && role !== 'vendor' && role !== 'admin') {
            // Redirect to home or show error?
            return NextResponse.redirect(new URL('/', request.url));
        }

        // Block non-admin from Admin routes
        if (isAdminRoute && role !== 'admin') {
            return NextResponse.redirect(new URL('/', request.url));
        }

        // Allow access
        const response = NextResponse.next();
        // Pass user info in headers to API routes if needed (optional)
        response.headers.set('x-user-id', payload.userId as string);
        response.headers.set('x-user-role', role);
        return response;

    } catch (error) {
        // Token invalid or expired
        if (isVendorRoute || isAdminRoute) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        return NextResponse.next();
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
