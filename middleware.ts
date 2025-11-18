// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rate limiting store (dalam production gunakan Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Rate limiting untuk API calls
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = 30; // max 30 requests per minute

    const clientData = rateLimitStore.get(ip);

    if (clientData) {
      if (now < clientData.resetTime) {
        if (clientData.count >= maxRequests) {
          return new NextResponse("Too Many Requests", { status: 429 });
        }
        clientData.count++;
      } else {
        rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
      }
    } else {
      rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    }
  }

  // Security headers sudah diset di next.config.ts
  // Tambahan proteksi untuk specific routes

  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "SAMEORIGIN");

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
