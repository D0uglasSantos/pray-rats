"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await signIn(formData);
    if (!result.success) {
      setError(result.error);
      setLoading(false);
    }
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
  );
}
