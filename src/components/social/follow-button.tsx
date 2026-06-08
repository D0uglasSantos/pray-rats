"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { followUser, unfollowUser, type FollowStatus } from "@/actions/follows";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FollowButtonProps {
  targetUserId: string;
  initialStatus: FollowStatus;
}

export function FollowButton({ targetUserId, initialStatus }: FollowButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  function handleFollow() {
    startTransition(async () => {
      const result = await followUser(targetUserId);
      if (result.success) {
        showToast(
          initialStatus.isFollowedBy ? "Agora vocês são amigos!" : "Usuário seguido.",
          "success",
        );
        router.refresh();
      } else {
        showToast(result.error, "error");
      }
    });
  }

  function handleUnfollow() {
    startTransition(async () => {
      const result = await unfollowUser(targetUserId);
      if (result.success) {
        showToast("Deixou de seguir.", "success");
        router.refresh();
      } else {
        showToast(result.error, "error");
      }
    });
  }

  if (initialStatus.isFriend) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="accent">Amigos</Badge>
        <Button variant="secondary" size="sm" loading={isPending} onClick={handleUnfollow}>
          Deixar de seguir
        </Button>
      </div>
    );
  }

  if (initialStatus.isFollowing) {
    return (
      <Button variant="secondary" size="sm" loading={isPending} onClick={handleUnfollow}>
        Seguindo
      </Button>
    );
  }

  return (
    <Button size="sm" loading={isPending} onClick={handleFollow}>
      {initialStatus.isFollowedBy ? "Seguir de volta" : "Seguir"}
    </Button>
  );
}
