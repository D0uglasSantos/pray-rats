"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ActivityListPaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function ActivityListPagination({
  page,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  onPageChange,
  className,
}: ActivityListPaginationProps) {
  if (totalItems === 0 || totalPages <= 1) return null;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1",
        className,
      )}
    >
      <p className="text-xs text-muted text-center sm:text-left">
        Mostrando {startIndex}–{endIndex} de {totalItems}
      </p>

      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Página anterior"
          className={cn(
            "h-9 w-9 rounded-lg border border-border bg-surface flex items-center justify-center",
            "text-muted hover:text-foreground hover:bg-surface-secondary transition-colors",
            "disabled:opacity-40 disabled:pointer-events-none",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="text-sm text-foreground min-w-[4.5rem] text-center">
          {page} de {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Próxima página"
          className={cn(
            "h-9 w-9 rounded-lg border border-border bg-surface flex items-center justify-center",
            "text-muted hover:text-foreground hover:bg-surface-secondary transition-colors",
            "disabled:opacity-40 disabled:pointer-events-none",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
