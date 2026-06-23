"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateGroup, removeMember } from "@/actions/groups";
import { GroupActivitiesSection } from "@/components/groups/activities/group-activities-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ArrowLeft, Copy, Check } from "lucide-react";
import type { Group, ActivityType } from "@/types/database";

interface AdminPanelProps {
  group: Group;
  members: Array<{
    id: string;
    role: string;
    profile?: { name: string; avatar_url?: string | null } | null;
  }>;
  activities: ActivityType[];
  inviteUrl: string;
}

export function AdminPanel({
  group,
  members,
  activities,
  inviteUrl,
}: AdminPanelProps) {
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function copyInvite() {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleGroupUpdate(formData: FormData) {
    startTransition(async () => {
      const result = await updateGroup(group.id, formData);
      setMessage(result.success ? "Grupo atualizado!" : result.error);
    });
  }

  function handleRemoveMember(memberId: string) {
    if (!confirm("Remover este membro do grupo?")) return;
    startTransition(async () => {
      await removeMember(group.id, memberId);
    });
  }

  return (
    <div className="space-y-6 pb-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <h1 className="text-2xl font-bold">Admin do grupo</h1>

      <Card>
        <p className="font-medium mb-3">Convite</p>
        <div className="flex items-center gap-2 mb-2">
          <code className="flex-1 bg-surface-secondary px-3 py-2 rounded-lg text-sm font-mono">
            {group.invite_code}
          </code>
          <Button size="sm" variant="secondary" onClick={copyInvite}>
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted break-all">{inviteUrl}</p>
      </Card>

      <Card>
        <p className="font-medium mb-4">Editar grupo</p>
        <form action={handleGroupUpdate} className="space-y-3">
          <Input name="name" label="Nome" defaultValue={group.name} required />
          <Textarea
            name="description"
            label="Descrição"
            defaultValue={group.description ?? ""}
          />
          <Input
            name="start_date"
            type="date"
            label="Início"
            defaultValue={group.start_date ?? ""}
          />
          <Input
            name="end_date"
            type="date"
            label="Fim"
            defaultValue={group.end_date ?? ""}
          />
          {message && (
            <p className="text-sm text-success text-center">{message}</p>
          )}
          <Button type="submit" fullWidth loading={isPending} size="sm">
            Salvar
          </Button>
        </form>
      </Card>

      <Card>
        <p className="font-medium mb-3">Membros ({members.length})</p>
        <div className="space-y-2">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between py-2 border-b border-border last:border-0"
            >
              <div className="flex items-center gap-2">
                <Avatar
                  src={m.profile?.avatar_url}
                  name={m.profile?.name ?? "?"}
                  size="sm"
                />
                <span className="text-sm">{m.profile?.name}</span>
                {m.role === "admin" && <Badge variant="primary">Admin</Badge>}
              </div>
              {m.role !== "admin" && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveMember(m.id)}
                  className="text-error text-xs h-8"
                >
                  Remover
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <GroupActivitiesSection groupId={group.id} activities={activities} />
      </Card>
    </div>
  );
}
