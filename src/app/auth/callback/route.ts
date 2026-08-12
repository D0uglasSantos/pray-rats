import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseUrl } from "@/lib/supabase/url";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

async function resolvePostAuthPath(
  supabase: ReturnType<typeof createServerClient>,
  requestedNext: string | null,
): Promise<string> {
  if (requestedNext && requestedNext !== "/" && requestedNext !== "/home") {
    return requestedNext;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return requestedNext ?? "/home";
  }

  const { count } = await supabase
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  return (count ?? 0) === 0 ? "/onboarding" : "/home";
}

function errorLandingPath(next: string | null): string {
  return next === "/reset-password" ? "/reset-password" : "/login";
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const authError = searchParams.get("error_code") ?? searchParams.get("error");
  const failPath = errorLandingPath(next);

  if (authError) {
    const params = new URLSearchParams({ error: authError });
    return NextResponse.redirect(`${origin}${failPath}?${params.toString()}`);
  }

  if (code) {
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

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const destination = await resolvePostAuthPath(supabase, next);
      const response = NextResponse.redirect(`${origin}${destination}`);
      cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });
      return response;
    }

    if (process.env.NODE_ENV === "development") {
      console.warn("[auth/callback] exchangeCodeForSession falhou:", error.message);
    }
  }

  return NextResponse.redirect(`${origin}${failPath}?error=auth`);
}
