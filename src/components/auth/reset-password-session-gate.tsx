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

function clearAuthParamsFromUrl() {
  window.history.replaceState(null, "", "/reset-password");
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

      // Fluxo implicit: tokens vêm no hash (não exigem code_verifier).
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (cancelled) return;

        if (sessionError) {
          setError(
            "Não foi possível validar o link de recuperação. Solicite um novo.",
          );
          return;
        }

        clearAuthParamsFromUrl();
        router.refresh();
        setReady(true);
        return;
      }

      // Sessão já estabelecida (ex.: detectSessionInUrl / visita após troca).
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;

      if (session) {
        if (searchParams.get("code") || window.location.hash) {
          clearAuthParamsFromUrl();
          router.refresh();
        }
        setReady(true);
        return;
      }

      // Fallback PKCE (e-mails antigos gerados com code_challenge).
      const code = searchParams.get("code");
      if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;

        if (!exchangeError) {
          clearAuthParamsFromUrl();
          router.refresh();
          setReady(true);
          return;
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (cancelled) return;

        if (user) {
          clearAuthParamsFromUrl();
          router.refresh();
          setReady(true);
          return;
        }

        if (process.env.NODE_ENV === "development") {
          console.warn(
            "[reset-password] exchangeCodeForSession:",
            exchangeError.message,
          );
        }

        setError(
          "Link inválido ou expirado. Solicite um novo e-mail de recuperação e use o link mais recente.",
        );
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
      <p className="text-sm text-muted text-center">
        Validando link de recuperação…
      </p>
    );
  }

  return <ResetPasswordForm />;
}
