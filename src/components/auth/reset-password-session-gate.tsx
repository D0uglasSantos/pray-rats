"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

function getAuthErrorFromUrl(): string | null {
  if (typeof window === "undefined") return null;

  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

  const code =
    query.get("error_code") ??
    hash.get("error_code") ??
    query.get("error") ??
    hash.get("error");

  if (!code) return null;

  if (code === "otp_expired") {
    return "Este link expirou ou já foi usado. Solicite um novo e-mail de recuperação.";
  }

  return "Não foi possível validar o link de recuperação. Tente novamente.";
}

export function ResetPasswordSessionGate() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function establishSession() {
      const urlError = getAuthErrorFromUrl();
      if (urlError) {
        setError(urlError);
        return;
      }

      const supabase = createClient();
      const code = searchParams.get("code");

      if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;

        if (exchangeError) {
          setError(
            "Link inválido ou expirado. Solicite um novo e-mail de recuperação.",
          );
          return;
        }

        router.replace("/reset-password");
        router.refresh();
        setReady(true);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;

      if (user) {
        setReady(true);
        return;
      }

      setError(
        "Sessão não encontrada. Abra o link mais recente do e-mail ou solicite um novo.",
      );
    }

    void establishSession();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-error">{error}</p>
        <Link
          href="/forgot-password"
          className="text-primary font-medium hover:underline text-sm"
        >
          Solicitar novo link
        </Link>
      </div>
    );
  }

  if (!ready) {
    return (
      <p className="text-sm text-muted text-center">Validando link de recuperação…</p>
    );
  }

  return <ResetPasswordForm />;
}
