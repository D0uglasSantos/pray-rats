"use client";

import { useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { setActiveGroup } from "@/actions/auth";
import type { GroupWithRole } from "@/types/database";
import { cn } from "@/lib/utils/cn";

export function GroupSwitcher({
  groups,
  activeGroupId,
  variant = "dark",
}: {
  groups: GroupWithRole[];
  activeGroupId: string | null;
  variant?: "dark" | "light";
}) {
  const [isPending, startTransition] = useTransition();

  if (groups.length <= 1) {
    const group = groups[0];
    if (!group) return null;
    return (
      <span
        className={cn(
          "text-sm font-medium truncate",
          variant === "dark" ? "text-white/90" : "text-foreground",
        )}
      >
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
          "appearance-none text-sm font-medium rounded-lg pl-3 pr-8 py-1.5",
          "focus:outline-none focus:ring-2 max-w-[180px] truncate",
          variant === "dark"
            ? "bg-white/15 text-white border border-white/20 focus:ring-white/30"
            : "bg-surface border border-border text-foreground focus:ring-primary/30",
        )}
      >
        {groups.map((g) => (
          <option key={g.id} value={g.id} className="text-foreground">
            {g.name}
          </option>
        ))}
      </select>
      <ChevronDown
        className={cn(
          "absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none",
          variant === "dark" ? "text-white/70" : "text-muted",
        )}
      />
    </div>
  );
}
