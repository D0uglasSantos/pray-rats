"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getPushServerStatus,
  savePushSubscription,
  removePushSubscription,
} from "@/actions/notifications";
import { useToast } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import { Bell, BellOff, AlertCircle } from "lucide-react";

type PushUiStatus =
  | "loading"
  | "unsupported"
  | "not_configured"
  | "denied"
  | "inactive"
  | "active";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function statusLabel(status: PushUiStatus): string {
  switch (status) {
    case "loading":
      return "Verificando…";
    case "unsupported":
      return "Seu navegador não suporta push";
    case "not_configured":
      return "Push ainda não configurado no servidor";
    case "denied":
      return "Permissão bloqueada nas configurações do navegador";
    case "inactive":
      return "Desativado — toque para ativar";
    case "active":
      return "Ativo — você receberá alertas de check-ins";
  }
}

export function PushNotificationToggle() {
  const [status, setStatus] = useState<PushUiStatus>("loading");
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    async function syncState() {
      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        setStatus("unsupported");
        return;
      }

      const server = await getPushServerStatus();
      if (!server.configured || !vapidPublicKey) {
        setStatus("not_configured");
        return;
      }

      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setStatus(subscription ? "active" : "inactive");
      } catch {
        setStatus("inactive");
      }
    }

    void syncState();
  }, [vapidPublicKey]);

  async function enablePush() {
    if (status === "not_configured" || !vapidPublicKey) {
      showToast("Notificações push não configuradas no servidor.", "error");
      return;
    }

    if (status === "unsupported") {
      showToast("Seu navegador não suporta notificações push.", "error");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setStatus("denied");
      showToast("Permissão de notificação negada.", "error");
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
    }

    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      showToast("Não foi possível registrar a inscrição push.", "error");
      return;
    }

    startTransition(async () => {
      const result = await savePushSubscription({
        endpoint: json.endpoint!,
        keys: { p256dh: json.keys!.p256dh!, auth: json.keys!.auth! },
      });

      if (result.success) {
        setStatus("active");
        showToast("Alertas no celular ativados!", "success");
      } else {
        setStatus("inactive");
        showToast(result.error, "error");
      }
    });
  }

  async function disablePush() {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      startTransition(async () => {
        await removePushSubscription(endpoint);
        setStatus("inactive");
        showToast("Alertas no celular desativados.", "info");
      });
    } else {
      setStatus("inactive");
    }
  }

  const canToggle =
    status === "active" || status === "inactive" || status === "denied";
  const enabled = status === "active";
  const showWarning = status === "not_configured" || status === "unsupported";

  const StatusIcon =
    status === "active"
      ? Bell
      : status === "not_configured" || status === "unsupported"
        ? AlertCircle
        : BellOff;

  return (
    <Card padding="sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <StatusIcon
            className={`h-5 w-5 shrink-0 ${
              showWarning ? "text-yellow-600" : "text-primary"
            }`}
          />
          <div className="min-w-0">
            <p className="text-sm font-medium">Alertas no celular</p>
            <p className="text-xs text-muted">{statusLabel(status)}</p>
          </div>
        </div>
        {canToggle && (
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label="Ativar alertas no celular"
            disabled={isPending || status === "denied"}
            onClick={() => (enabled ? disablePush() : enablePush())}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
              enabled ? "bg-primary" : "bg-border"
            } ${isPending || status === "denied" ? "opacity-50" : ""}`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                enabled ? "left-5" : "left-0.5"
              }`}
            />
          </button>
        )}
      </div>
    </Card>
  );
}
