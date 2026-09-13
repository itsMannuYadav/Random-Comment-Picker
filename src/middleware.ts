import { NextRequest, NextResponse } from "next/server";

// Handle OPTIONS preflight requests for API routes so browser extensions
// (and any other cross-origin callers) don't get blocked before the actual
// request is made. The matching CORS headers are also added statically via
// next.config.ts; this handles the OPTIONS method that Next.js doesn't route
// to individual route handlers by default.
export function middleware(req: NextRequest) {
  if (req.method === "OPTIONS" && req.nextUrl.pathname.startsWith("/api/")) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
