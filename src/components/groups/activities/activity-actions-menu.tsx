"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, MoreVertical, Pencil, Power, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ActivityActionsMenuProps {
  onEdit: () => void;
  onDuplicate: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  isActive: boolean;
  disabled?: boolean;
}

export function ActivityActionsMenu({
  onEdit,
  onDuplicate,
  onToggleActive,
  onDelete,
  isActive,
  disabled = false,
}: ActivityActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        disabled={disabled}
        aria-label="Ações da atividade"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        className={cn(
          "h-9 w-9 rounded-lg flex items-center justify-center text-muted",
          "hover:text-foreground hover:bg-surface-secondary transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        )}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 z-20 min-w-[180px] rounded-xl border border-border bg-surface shadow-lg py-1"
        >
          <MenuItem
            icon={Pencil}
            label="Editar"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          />
          <MenuItem
            icon={Copy}
            label="Duplicar"
            onClick={() => {
              setOpen(false);
              onDuplicate();
            }}
          />
          <MenuItem
            icon={Power}
            label={isActive ? "Desativar" : "Ativar"}
            onClick={() => {
              setOpen(false);
              onToggleActive();
            }}
          />
          <div className="my-1 border-t border-border" />
          <MenuItem
            icon={Trash2}
            label="Excluir"
            destructive
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          />
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  destructive = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left transition-colors",
        destructive
          ? "text-error hover:bg-error/5"
          : "text-foreground hover:bg-surface-secondary",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </button>
  );
}
