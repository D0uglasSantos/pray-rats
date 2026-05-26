"use client";

import { useTransition } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { markAsRead, markAllAsRead, type Notification } from "@/actions/notifications";
import { useToast } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils/cn";

interface NotificationsListProps {
  notifications: Notification[];
}

export function NotificationsList({ notifications }: NotificationsListProps) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  function handleMarkAll() {
    startTransition(async () => {
      const result = await markAllAsRead();
      if (result.success) {
        showToast("Todas marcadas como lidas.", "success");
      } else {
        showToast(result.error, "error");
      }
    });
  }

  function handleMarkOne(id: string) {
    startTransition(async () => {
      await markAsRead(id);
    });
  }

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  if (notifications.length === 0) {
    return (
      <EmptyState
        title="Nenhuma notificação"
        description="Quando alguém do grupo registrar um check-in, você verá aqui."
      />
    );
  }

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <Button
          variant="secondary"
          size="sm"
          loading={isPending}
          onClick={handleMarkAll}
        >
          Marcar todas como lidas
        </Button>
      )}

      <div className="space-y-2">
        {notifications.map((notification) => {
          const content = (
            <Card
              padding="sm"
              className={cn(
                "transition-colors",
                !notification.read_at && "border-primary/30 bg-primary/5",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{notification.title}</p>
                  {notification.body && (
                    <p className="text-xs text-muted mt-0.5">{notification.body}</p>
                  )}
                  <p className="text-[10px] text-muted mt-1">
                    {formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
                {!notification.read_at && (
                  <span className="h-2 w-2 rounded-full bg-accent shrink-0 mt-1.5" />
                )}
              </div>
            </Card>
          );

          if (notification.link) {
            return (
              <Link
                key={notification.id}
                href={notification.link}
                onClick={() => handleMarkOne(notification.id)}
              >
                {content}
              </Link>
            );
          }

          return (
            <div
              key={notification.id}
              onClick={() => !notification.read_at && handleMarkOne(notification.id)}
              role="button"
              tabIndex={0}
            >
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
