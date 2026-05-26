"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setActiveGroup } from "@/actions/auth";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import type { GroupWithRole } from "@/types/database";

interface GroupListItemProps {
  group: GroupWithRole;
  isActive: boolean;
}

export function GroupListItem({ group, isActive }: GroupListItemProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  function handleActivate() {
    startTransition(async () => {
      const result = await setActiveGroup(group.id);
      if (result.success) {
        showToast(`Grupo "${group.name}" ativado.`, "success");
        router.push("/group");
        router.refresh();
      } else {
        showToast(result.error, "error");
      }
    });
  }

  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0 gap-2">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{group.name}</p>
        {isActive && (
          <p className="text-[10px] text-primary font-medium">Grupo ativo</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {group.role === "admin" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/groups/${group.id}/admin`)}
          >
            Admin
          </Button>
        )}
        {!isActive && (
          <Button size="sm" loading={isPending} onClick={handleActivate}>
            Ativar
          </Button>
        )}
      </div>
    </div>
  );
}
