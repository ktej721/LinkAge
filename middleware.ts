import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ROLE_ROUTES: Record<string, string> = {
  '/senior': 'senior',
  '/helper': 'helper',
  '/owner': 'owner',
};

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('linkage_session')?.value;
  const path = request.nextUrl.pathname;

  // Check if protected route
  const protectedPrefix = Object.keys(ROLE_ROUTES).find(prefix => path.startsWith(prefix));
  
  if (protectedPrefix) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Role check is done in layouts via getSession()
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/senior/:path*', '/helper/:path*', '/owner/:path*'],
};
