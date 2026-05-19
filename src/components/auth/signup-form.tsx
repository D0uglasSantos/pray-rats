"use client";

import { useState } from "react";
import Link from "next/link";
import { signUp } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setSuccess(null);
    const result = await signUp(formData);
    if (!result.success) {
      setError(result.error);
    } else if (result.needsEmailConfirmation) {
      setSuccess(
        "Conta criada! Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada e spam.",
      );
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <p className="text-foreground">{success}</p>
        <Link href="/login" className="text-primary font-medium hover:underline text-sm">
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <Input
        name="name"
        type="text"
        label="Nome"
        placeholder="Seu nome"
        required
        autoComplete="name"
      />
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
        placeholder="Mínimo 6 caracteres"
        required
        minLength={6}
        autoComplete="new-password"
      />
      {error && (
        <p className="text-sm text-error text-center">{error}</p>
      )}
      <Button type="submit" fullWidth loading={loading}>
        Criar conta
      </Button>
      <p className="text-center text-sm text-muted">
        Já tem conta?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
