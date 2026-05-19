"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Newspaper, Plus, Users, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/", label: "Hoje", icon: Home },
  { href: "/group", label: "Grupo", icon: Users },
  { href: "/check-in", label: "Check-in", icon: Plus, highlight: true },
  { href: "/feed", label: "Feed", icon: Newspaper },
  { href: "/profile", label: "Perfil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-lg border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-lg flex items-end justify-around px-2 pt-2 pb-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          if (item.highlight) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center -mt-4"
              >
                <div
                  className={cn(
                    "h-14 w-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95",
                    "gradient-spiritual text-white",
                  )}
                >
                  <Icon className="h-7 w-7" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-medium text-primary mt-1">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 min-w-[56px] py-1 transition-colors",
                isActive ? "text-primary" : "text-muted",
              )}
            >
              <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
