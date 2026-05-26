"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/actions/profile";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import type { Profile } from "@/types/database";

export function ProfileForm({ profile }: { profile: Profile | null }) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result.success) {
        showToast("Perfil atualizado!", "success");
      } else {
        showToast(result.error, "error");
      }
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
        <Button type="submit" fullWidth loading={isPending} size="sm">
          Salvar
        </Button>
      </form>
    </Card>
  );
}
