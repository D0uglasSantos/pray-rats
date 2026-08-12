"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { resetPassword } from "@/actions/auth";
import { mapActionError } from "@/lib/errors/map-action-error";
import { getPasswordResetRedirectUrl } from "@/lib/app-url";
import { getSupabaseUrl } from "@/lib/supabase/url";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Cliente só para disparar o e-mail de recovery em fluxo implicit.
 * Assim o link não exige code_verifier PKCE no mesmo browser.
 */
function createRecoveryEmailClient() {
  return createSupabaseClient(
    getSupabaseUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: "implicit",
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const email = formData.get("email") as string;
    const rateLimit = await resetPassword(formData);
    if (!rateLimit.success) {
      setError(rateLimit.error);
      setLoading(false);
      return;
    }

    const supabase = createRecoveryEmailClient();
    const { error: sendError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: getPasswordResetRedirectUrl() },
    );

    if (sendError) {
      setError(mapActionError(sendError.message, { context: "auth" }));
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <p className="text-foreground">
          Enviamos um link de recuperação para seu e-mail. Verifique sua caixa
          de entrada.
        </p>
        <p className="text-xs text-muted">
          Use o link mais recente. Se o e-mail atrasar, confira a pasta de spam.
        </p>
        <Link
          href="/login"
          className="text-primary font-medium hover:underline text-sm"
        >
          Voltar ao login
        </Link>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <Input
        name="email"
        type="email"
        label="E-mail"
        placeholder="seu@email.com"
        required
        autoComplete="email"
      />
      {error && (
        <p className="text-sm text-error text-center">{error}</p>
      )}
      <Button type="submit" fullWidth loading={loading}>
        Enviar link
      </Button>
      <p className="text-center text-sm text-muted">
        <Link href="/login" className="text-primary hover:underline">
          Voltar ao login
        </Link>
      </p>
    </form>
  );
}
