"use client";

import { useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { setActiveGroup } from "@/actions/auth";
import type { GroupWithRole } from "@/types/database";
import { cn } from "@/lib/utils/cn";

export function GroupSwitcher({
  groups,
  activeGroupId,
}: {
  groups: GroupWithRole[];
  activeGroupId: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  if (groups.length <= 1) {
    const group = groups[0];
    if (!group) return null;
    return (
      <span className="text-sm font-medium text-white/90 truncate">
        {group.name}
      </span>
    );
  }

  return (
    <div className="relative">
      <select
        disabled={isPending}
        value={activeGroupId ?? groups[0]?.id ?? ""}
        onChange={(e) => {
          startTransition(async () => {
            await setActiveGroup(e.target.value);
          });
        }}
        className={cn(
          "appearance-none bg-white/15 text-white text-sm font-medium",
          "rounded-lg pl-3 pr-8 py-1.5 border border-white/20",
          "focus:outline-none focus:ring-2 focus:ring-white/30",
          "max-w-[180px] truncate",
        )}
      >
        {groups.map((g) => (
          <option key={g.id} value={g.id} className="text-foreground">
            {g.name}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70 pointer-events-none" />
    </div>
  );
}
