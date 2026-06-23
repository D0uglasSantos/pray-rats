"use client";

import { type ReactNode } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { ActivityFilter } from "@/lib/activity-display";

interface ActivityFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  filter: ActivityFilter;
  onFilterChange: (filter: ActivityFilter) => void;
  headerAction?: ReactNode;
}

const FILTER_OPTIONS: Array<{ value: ActivityFilter; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "active", label: "Ativas" },
  { value: "inactive", label: "Inativas" },
  { value: "private", label: "Privadas" },
];

export function ActivityFilters({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  headerAction,
}: ActivityFiltersProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar atividade..."
            aria-label="Buscar atividade"
            className={cn(
              "w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-surface text-sm",
              "placeholder:text-muted/60 outline-none",
              "focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary",
            )}
          />
        </div>
        {headerAction}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onFilterChange(option.value)}
            className={cn(
              "shrink-0 h-8 px-3 rounded-full text-xs font-medium transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
              filter === option.value
                ? "bg-primary text-white"
                : "bg-surface border border-border text-muted hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
