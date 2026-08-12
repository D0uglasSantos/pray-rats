"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import EmojiPicker, { type EmojiClickData, Theme } from "emoji-picker-react";
import { SmilePlus } from "lucide-react";
import { toggleCheckinReaction } from "@/actions/checkin-engagement";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";
import type { FeedReactionSummary } from "@/types/feed";

interface CheckinReactionsProps {
  checkinId: string;
  initialReactions?: FeedReactionSummary[];
  initialMyReaction?: string | null;
}

function applyToggle(
  reactions: FeedReactionSummary[],
  myReaction: string | null,
  emoji: string,
): { reactions: FeedReactionSummary[]; myReaction: string | null } {
  const next = new Map(reactions.map((r) => [r.emoji, r.count]));

  if (myReaction) {
    const prevCount = (next.get(myReaction) ?? 1) - 1;
    if (prevCount <= 0) next.delete(myReaction);
    else next.set(myReaction, prevCount);
  }

  let nextMyReaction: string | null = emoji;
  if (myReaction === emoji) {
    nextMyReaction = null;
  } else {
    next.set(emoji, (next.get(emoji) ?? 0) + 1);
  }

  return {
    myReaction: nextMyReaction,
    reactions: [...next.entries()]
      .map(([e, count]) => ({
        emoji: e,
        count,
        reactedByMe: nextMyReaction === e,
      }))
      .sort((a, b) => b.count - a.count || a.emoji.localeCompare(b.emoji)),
  };
}

export function CheckinReactions({
  checkinId,
  initialReactions = [],
  initialMyReaction = null,
}: CheckinReactionsProps) {
  const { showToast } = useToast();
  const [reactions, setReactions] = useState(initialReactions);
  const [myReaction, setMyReaction] = useState(initialMyReaction);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReactions(initialReactions);
    setMyReaction(initialMyReaction);
  }, [initialReactions, initialMyReaction]);

  useEffect(() => {
    if (!pickerOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setPickerOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [pickerOpen]);

  function commitReaction(emoji: string) {
    const previous = { reactions, myReaction };
    const optimistic = applyToggle(reactions, myReaction, emoji);
    setReactions(optimistic.reactions);
    setMyReaction(optimistic.myReaction);
    setPickerOpen(false);

    startTransition(async () => {
      const result = await toggleCheckinReaction(checkinId, emoji);
      if (!result.success) {
        setReactions(previous.reactions);
        setMyReaction(previous.myReaction);
        showToast(result.error, "error");
        return;
      }
      setMyReaction(result.data?.myReaction ?? null);
    });
  }

  function handleEmojiClick(data: EmojiClickData) {
    commitReaction(data.emoji);
  }

  return (
    <div ref={rootRef} className="relative space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {reactions.map((reaction) => (
          <button
            key={reaction.emoji}
            type="button"
            disabled={isPending}
            onClick={() => commitReaction(reaction.emoji)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm transition-colors",
              reaction.reactedByMe
                ? "border-primary/40 bg-primary/10 text-foreground"
                : "border-border bg-surface-secondary text-foreground hover:bg-border/40",
            )}
            aria-label={`Reagir com ${reaction.emoji}`}
          >
            <span>{reaction.emoji}</span>
            <span className="text-xs text-muted">{reaction.count}</span>
          </button>
        ))}

        <button
          type="button"
          disabled={isPending}
          onClick={() => setPickerOpen((open) => !open)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface-secondary text-muted hover:bg-border/40 hover:text-foreground"
          aria-label="Adicionar reação"
          aria-expanded={pickerOpen}
        >
          <SmilePlus className="h-4 w-4" />
        </button>
      </div>

      {pickerOpen && (
        <div className="absolute left-0 z-30 mt-1 shadow-lg">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme={Theme.LIGHT}
            width={320}
            height={360}
            searchPlaceHolder="Buscar emoji"
            previewConfig={{ showPreview: false }}
            lazyLoadEmojis
          />
        </div>
      )}
    </div>
  );
}
