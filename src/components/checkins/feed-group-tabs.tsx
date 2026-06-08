"use client";

import Link from "next/link";
import type { GroupWithRole } from "@/types/database";
import { cn } from "@/lib/utils/cn";

interface FeedGroupTabsProps {
  groups: GroupWithRole[];
  activeGroupId: string;
}

export function FeedGroupTabs({ groups, activeGroupId }: FeedGroupTabsProps) {
  if (groups.length <= 1) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
      {groups.map((group) => {
        const isActive = group.id === activeGroupId;
        const href = `/feed?group=${group.id}`;

        return (
          <Link
            key={group.id}
            href={href}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-white"
                : "bg-surface-secondary text-muted hover:text-foreground",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {group.name}
          </Link>
        );
      })}
    </div>
  );
}
