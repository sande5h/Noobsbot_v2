import { NextResponse } from "next/server";

// Lightweight gate: bounce to /login if there's no session cookie.
// Full JWT verification happens server-side in each page/route.
export function middleware(req) {
  if (!req.cookies.get("nb_session")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/rooms/:path*", "/admin/:path*"],
};
