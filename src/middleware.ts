import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest, NextResponse } from "next/server";

const publicRoutes = ["/", "/login", "/signup", "/forgot-password", "/auth/callback"];
const authRoutes = ["/login", "/signup", "/forgot-password"];

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isPublic = publicRoutes.some((r) => pathname.startsWith(r));
  const isAuthRoute = authRoutes.some((r) => pathname === r);
  const isInvite = pathname.startsWith("/invite/");

  if (!user && !isPublic && !isInvite) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
