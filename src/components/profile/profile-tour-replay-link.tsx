"use client";

import { BookOpen, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";

export function ProfileTourReplayLink() {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-medium text-foreground">Ajuda</h3>
      <a
        href="/home?tour=replay"
        className="block"
      >
        <Card
          padding="sm"
          className="flex items-center gap-3 hover:ring-2 hover:ring-primary/20 transition-all"
        >
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-foreground">Ver tutorial do aplicativo</p>
            <p className="text-xs text-muted">
              Veja novamente como usar as principais funções do PrayRats.
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted shrink-0" aria-hidden="true" />
        </Card>
      </a>
    </section>
  );
}
