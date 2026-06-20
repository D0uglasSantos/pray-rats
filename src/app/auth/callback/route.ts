import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function resolvePostAuthPath(
  supabase: Awaited<ReturnType<typeof createClient>>,
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

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const authError = searchParams.get("error_code") ?? searchParams.get("error");

  if (authError) {
    const params = new URLSearchParams({ error: authError });
    return NextResponse.redirect(`${origin}/login?${params.toString()}`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const destination = await resolvePostAuthPath(supabase, next);
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
