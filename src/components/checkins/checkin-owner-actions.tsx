"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CheckinOwnerActions({ checkinId }: { checkinId: string }) {
  return (
    <Link href={`/check-in/${checkinId}/edit`}>
      <Button variant="ghost" size="sm" aria-label="Editar check-in">
        <Pencil className="h-4 w-4" />
      </Button>
    </Link>
  );
}
