import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest, NextResponse } from "next/server";

const publicRoutes = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/auth/confirm",
  "/account-deletion",
  "/privacy",
  "/terms",
  "/support",
  "/privacidade",
  "/termos",
  "/suporte",
  "/pt",
  "/politica-de-privacidade",
  "/termos-de-uso",
  "/termos-de-servico",
  "/ajuda",
  "/help",
];
const authRoutes = ["/login", "/signup", "/forgot-password"];

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const code = searchParams.get("code");

  // Supabase pode redirecionar com ?code= para a home se a URL exata não estiver na allow list
  if (
    code &&
    pathname !== "/auth/callback" &&
    pathname !== "/auth/confirm" &&
    pathname !== "/reset-password"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/reset-password";
    url.search = `code=${encodeURIComponent(code)}`;
    return NextResponse.redirect(url);
  }

  const { supabaseResponse, user } = await updateSession(request);

  const isPublic = publicRoutes.some((route) =>
    route === "/" ? pathname === "/" : pathname.startsWith(route),
  );
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
    "/((?!_next/static|_next/image|api|\\.well-known|favicon.ico|icons|manifest.json|sw.js|push-handler.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
