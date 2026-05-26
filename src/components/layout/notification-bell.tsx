"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface NotificationBellProps {
  initialUnreadCount?: number;
}

export function NotificationBell({ initialUnreadCount = 0 }: NotificationBellProps) {
  return (
    <Link
      href="/notifications"
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-xl",
        "border border-border bg-surface hover:bg-surface-secondary transition-colors",
      )}
      aria-label={
        initialUnreadCount > 0
          ? `${initialUnreadCount} notificações não lidas`
          : "Notificações"
      }
    >
      <Bell className="h-5 w-5 text-foreground" />
      {initialUnreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white px-1">
          {initialUnreadCount > 99 ? "99+" : initialUnreadCount}
        </span>
      )}
    </Link>
  );
}
