"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setActiveGroup } from "@/actions/auth";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export function ActivateGroupButton({ groupId, groupName }: { groupId: string; groupName: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  function handleActivate() {
    startTransition(async () => {
      const result = await setActiveGroup(groupId);
      if (result.success) {
        showToast(`Grupo "${groupName}" ativado.`, "success");
        router.refresh();
      } else {
        showToast(result.error, "error");
      }
    });
  }

  return (
    <Button variant="ghost" size="sm" fullWidth loading={isPending} onClick={handleActivate}>
      Usar como grupo ativo <ChevronRight className="h-4 w-4" />
    </Button>
  );
}
