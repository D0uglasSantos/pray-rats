"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface ActivityDrawerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  error?: string | null;
}

export function ActivityDrawer({
  open,
  title,
  onClose,
  children,
  footer,
  error,
}: ActivityDrawerProps) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end md:items-stretch md:justify-end bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={cn(
          "w-full bg-surface shadow-xl overflow-hidden flex flex-col",
          "max-h-[92vh] rounded-t-2xl md:rounded-none md:rounded-l-2xl md:max-h-none md:max-w-md",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <h2 className="font-semibold text-foreground">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-secondary transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">{children}</div>

        {error && (
          <p className="px-4 pb-2 text-sm text-error text-center">{error}</p>
        )}

        {footer && (
          <div className="shrink-0 border-t border-border p-4 bg-surface">{footer}</div>
        )}
      </div>
    </div>
  );
}

interface ActivityDrawerFooterProps {
  onCancel: () => void;
  onSave: () => void;
  saving?: boolean;
  saveLabel?: string;
}

export function ActivityDrawerFooter({
  onCancel,
  onSave,
  saving = false,
  saveLabel = "Salvar alterações",
}: ActivityDrawerFooterProps) {
  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="secondary"
        fullWidth
        disabled={saving}
        onClick={onCancel}
      >
        Cancelar
      </Button>
      <Button type="button" fullWidth loading={saving} onClick={onSave}>
        {saveLabel}
      </Button>
    </div>
  );
}
