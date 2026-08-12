import { type EmailOtpType } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseUrl } from "@/lib/supabase/url";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

/**
 * Troca token_hash do e-mail (template com {{ .TokenHash }}) por sessão.
 * Não depende de PKCE / code_verifier.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") || "/reset-password";
  const safeNext = next.startsWith("/") ? next : "/reset-password";

  if (token_hash && type) {
    const cookiesToSet: CookieToSet[] = [];

    const supabase = createServerClient(
      getSupabaseUrl(),
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookies) {
            cookiesToSet.push(...cookies);
          },
        },
      },
    );

    const { error } = await supabase.auth.verifyOtp({ type, token_hash });

    if (!error) {
      const response = NextResponse.redirect(`${origin}${safeNext}`);
      cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });
      return response;
    }

    if (process.env.NODE_ENV === "development") {
      console.warn("[auth/confirm] verifyOtp falhou:", error.message);
    }
  }

  return NextResponse.redirect(
    `${origin}/reset-password?error=otp_expired`,
  );
}
