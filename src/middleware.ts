import { NextRequest, NextResponse } from 'next/server';
import { verifyJwtToken } from '@/lib/jwtHelper/jwt';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Default redirect only for root access (/) to client login
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  const token = request.cookies.get('token')?.value;
  const url = request.nextUrl.clone();

  if (url.pathname.startsWith('/dashboard')) {
    if (!token || !verifyJwtToken(token)) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }



  return NextResponse.next();
}

export const config = {
  matcher: ['/'], // Added '/' and '/login' to the matcher
};
