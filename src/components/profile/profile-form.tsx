"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import type { Profile } from "@/types/database";

export function ProfileForm({ profile }: { profile: Profile | null }) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateProfile(formData);
      setMessage(result.success ? "Perfil atualizado!" : result.error);
    });
  }

  return (
    <Card>
      <p className="font-medium mb-4">Editar perfil</p>
      <form action={handleSubmit} className="space-y-4">
        <Input
          name="name"
          label="Nome"
          defaultValue={profile?.name ?? ""}
          required
        />
        <Textarea
          name="bio"
          label="Bio (opcional)"
          defaultValue={profile?.bio ?? ""}
          maxLength={240}
        />
        {message && (
          <p
            className={`text-sm text-center ${
              message.includes("!") ? "text-success" : "text-error"
            }`}
          >
            {message}
          </p>
        )}
        <Button type="submit" fullWidth loading={isPending} size="sm">
          Salvar
        </Button>
      </form>
    </Card>
  );
}
