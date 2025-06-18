import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Suppress all console output in production
if (process.env.NODE_ENV === 'production') {
  const noop = () => {};
  
  // Override console methods in production
  if (typeof window === 'undefined') {
    // Server-side
    global.console = {
      ...console,
      log: noop,
      info: noop,
      warn: noop,
      error: noop,
      debug: noop,
      trace: noop,
    };
  }
}

export function middleware(request: NextRequest) {
  // Handle the request normally
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 