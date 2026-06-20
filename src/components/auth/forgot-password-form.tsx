"use client";

import { useState } from "react";
import Link from "next/link";
import { resetPassword } from "@/actions/auth";
import { mapActionError } from "@/lib/errors/map-action-error";
import { getPasswordResetRedirectUrl } from "@/lib/app-url";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

    const supabase = createClient();
    const { error: sendError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getPasswordResetRedirectUrl(),
    });

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
          Enviamos um link de recuperação para seu e-mail. Verifique sua caixa de entrada.
        </p>
        <p className="text-xs text-muted">
          Abra o link neste mesmo navegador (evite o app de e-mail interno).
        </p>
        <Link href="/login" className="text-primary font-medium hover:underline text-sm">
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
