import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import { NotificationsView } from "@/components/notifications/notifications-view";

export const metadata = {
  title: "Notifications | CIMS",
  description: "View and manage your notifications",
};

export default async function AdminNotificationsPage() {
  await requireRole([UserRole.ADMIN]);

  return (
    <DashboardLayout>
      <div className="p-6">
        <NotificationsView />
      </div>
    </DashboardLayout>
  );
}

