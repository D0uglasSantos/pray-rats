import { redirect } from "next/navigation";
import { getSessionUser } from "@/actions/auth";
import { getNotifications } from "@/actions/notifications";
import { PageHeader } from "@/components/layout/page-header";
import { NotificationsList } from "@/components/notifications/notifications-list";

export default async function NotificationsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const notifications = await getNotifications();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notificações"
        subtitle="Check-ins do grupo e avisos do app"
      />
      <NotificationsList notifications={notifications} />
    </div>
  );
}
