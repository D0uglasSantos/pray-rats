"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

export function GroupActionsTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-3">
      <Button
        fullWidth
        size="lg"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        {open ? (
          <>
            <X className="h-5 w-5" />
            Fechar
          </>
        ) : (
          <>
            <Plus className="h-5 w-5" />
            Criar ou entrar em grupo
          </>
        )}
      </Button>

      <div
        className={cn(
          "grid gap-2 overflow-hidden transition-all duration-300",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0 space-y-2">
          <Link href="/groups/create" onClick={() => setOpen(false)}>
            <Card className="flex items-center gap-4 hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer">
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="font-semibold text-sm">Criar grupo</p>
                <p className="text-xs text-muted">Inicie um desafio espiritual</p>
              </div>
            </Card>
          </Link>

          <Link href="/groups/join" onClick={() => setOpen(false)}>
            <Card className="flex items-center gap-4 hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer">
              <div className="h-11 w-11 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-primary-dark" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="font-semibold text-sm">Entrar em grupo</p>
                <p className="text-xs text-muted">Use um código de convite</p>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
