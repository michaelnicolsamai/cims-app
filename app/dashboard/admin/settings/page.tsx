import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import { SettingsView } from "@/components/settings/settings-view";

export const metadata = {
  title: "Settings | CIMS",
  description: "Manage your business settings",
};

export default async function AdminSettingsPage() {
  await requireRole([UserRole.ADMIN]);

  return (
    <DashboardLayout>
      <div className="p-6">
        <SettingsView />
      </div>
    </DashboardLayout>
  );
}

