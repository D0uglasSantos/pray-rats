"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "@/actions/auth";
import { AuthEmailDivider } from "@/components/auth/auth-email-divider";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("error") === "auth") {
      showToast(
        "Não foi possível concluir o login social. Tente novamente ou use e-mail.",
        "error",
      );
    }
  }, [searchParams, showToast]);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await signIn(formData);
    if (!result.success) {
      setError(result.error);
      showToast(result.error, "error");
      setLoading(false);
    }
  }

  return (
    <>
      <SocialAuthButtons />
      <AuthEmailDivider />
      <form action={handleSubmit} className="space-y-4">
      <Input
        name="email"
        type="email"
        label="E-mail"
        placeholder="seu@email.com"
        required
        autoComplete="email"
      />
      <Input
        name="password"
        type="password"
        label="Senha"
        placeholder="••••••••"
        required
        autoComplete="current-password"
      />
      {error && (
        <p className="text-sm text-error text-center">{error}</p>
      )}
      <Button type="submit" fullWidth loading={loading}>
        Entrar
      </Button>
      <p className="text-center text-sm text-muted">
        <Link href="/forgot-password" className="text-primary hover:underline">
          Esqueceu a senha?
        </Link>
      </p>
      <p className="text-center text-sm text-muted pt-2">
        Ainda não tem conta?{" "}
        <Link href="/signup" className="text-primary font-medium hover:underline">
          Criar conta
        </Link>
      </p>
    </form>
    </>
  );
}
