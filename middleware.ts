import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import toast from 'react-hot-toast';
import Toast from './components/Toast';

// I have defined public routes that do not require authentication.
const publicRoutes = ['/login', '/register'];

// I have defined protected routes that require a token.
const protectedRoutes = ['/dashboard', '/accounts', '/kyc', '/settings', '/transactions', '/wallet'];

// I have created a middleware to check for a token from cookies and redirect to /login for protected routes.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // I have allowed access to public routes (/login and /register) without checking for a token.
  if (publicRoutes.includes(pathname)) {
    console.log(`Middleware: Allowing public route ${pathname}`);
    return NextResponse.next();
  }

  // I have checked if the current path is a protected route.
  if (protectedRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
    // I have checked for the presence of a token in the cookies.
    const token = request.cookies.get('token')?.value;

    // I have logged the token and user check for debugging purposes.

    // I have redirected to /login if no token is found for protected routes.
    if (!token) {
      console.log(`Middleware: No token, redirecting to /login from ${pathname}`);
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // I have allowed the request to proceed if a token is found.
    
    console.log(`Middleware: Token found, proceeding to ${pathname}`);
  }

  return NextResponse.next();
}

// I have configured the middleware to run only on protected routes.
export const config = {
  matcher: ['/dashboard/:path*', '/accounts/:path*', '/kyc/:path*', '/settings/:path*', '/transactions/:path*', '/wallet/:path*'],
};