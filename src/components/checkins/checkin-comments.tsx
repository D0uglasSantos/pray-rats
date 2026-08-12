"use client";

import { useEffect, useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Trash2 } from "lucide-react";
import {
  addCheckinComment,
  deleteCheckinComment,
} from "@/actions/checkin-engagement";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { FeedComment } from "@/types/feed";

interface CheckinCommentsProps {
  checkinId: string;
  currentUserId: string;
  initialComments?: FeedComment[];
}

export function CheckinComments({
  checkinId,
  currentUserId,
  initialComments = [],
}: CheckinCommentsProps) {
  const { showToast } = useToast();
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;

    startTransition(async () => {
      const result = await addCheckinComment(checkinId, trimmed);
      if (!result.success) {
        showToast(result.error, "error");
        return;
      }
      if (result.data) {
        setComments((prev) => [...prev, result.data!]);
      }
      setBody("");
    });
  }

  function handleDelete(commentId: string) {
    setDeletingId(commentId);
    startTransition(async () => {
      const result = await deleteCheckinComment(commentId);
      if (!result.success) {
        showToast(result.error, "error");
        setDeletingId(null);
        return;
      }
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
      setDeletingId(null);
    });
  }

  return (
    <div className="space-y-3 border-t border-border pt-3">
      {comments.length > 0 && (
        <ul className="space-y-3">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-2">
              <Avatar
                src={comment.profile?.avatar_url}
                name={comment.profile?.name ?? "Usuário"}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {comment.profile?.name ?? "Usuário"}
                    </p>
                    <p className="text-xs text-muted/70">
                      {formatDistanceToNow(new Date(comment.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  {comment.user_id === currentUserId && (
                    <button
                      type="button"
                      disabled={isPending || deletingId === comment.id}
                      onClick={() => handleDelete(comment.id)}
                      className="shrink-0 rounded-md p-1 text-muted hover:bg-surface-secondary hover:text-error"
                      aria-label="Apagar comentário"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <p className="mt-1 text-sm text-foreground whitespace-pre-wrap wrap-break-word">
                  {comment.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={500}
          placeholder="Escreva um comentário..."
          disabled={isPending}
          className="h-10 flex-1 rounded-xl border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <Button
          type="submit"
          size="sm"
          disabled={isPending || !body.trim()}
          loading={isPending && deletingId === null}
        >
          Enviar
        </Button>
      </form>
    </div>
  );
}
