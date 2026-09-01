import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

if (!process.env.NEXTAUTH_URL && process.env.VERCEL_URL) {
  process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
}

function lockStaffResponse(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Content-Security-Policy", "frame-ancestors 'none'");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  return res;
}

export default withAuth(
  function middleware() {
    return lockStaffResponse(NextResponse.next());
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        if (path.startsWith("/login")) return true;
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/login",
    "/queue",
    "/queue/:path*",
    "/intakes",
    "/intakes/:path*",
    "/sources",
    "/sources/:path*",
    "/checklists",
    "/checklists/:path*",
    "/api/upload",
    "/api/upload/:path*",
  ],
};
