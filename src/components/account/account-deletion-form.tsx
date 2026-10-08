"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { createClient } from "@/lib/supabase/client";

export function AccountDeletionForm({ email }: { email: string }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteAccount() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError || !data.session) throw new Error("Senha incorreta.");

      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ confirmation }),
      });
      const result = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Não foi possível excluir sua conta.");
      }

      await supabase.auth.signOut({ scope: "local" });
      window.location.assign("/?accountDeleted=1");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <PasswordInput
        label="Confirme sua senha"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        autoComplete="current-password"
      />
      <Input
        label="Digite EXCLUIR"
        value={confirmation}
        onChange={(event) => setConfirmation(event.target.value)}
        autoCapitalize="characters"
        autoComplete="off"
      />
      {error && <p className="text-sm text-error" role="alert">{error}</p>}
      <Button
        type="button"
        variant="danger"
        fullWidth
        loading={loading}
        disabled={!password || confirmation.trim().toUpperCase() !== "EXCLUIR"}
        onClick={() => void deleteAccount()}
      >
        Excluir minha conta definitivamente
      </Button>
    </div>
  );
}
