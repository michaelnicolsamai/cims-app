import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import { ManagerDashboardOverview } from "@/components/dashboard/manager-dashboard-overview";

export default async function ManagerDashboardPage() {
  await requireRole([UserRole.MANAGER, UserRole.ADMIN]);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Manager Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Overview of your business operations and analytics
          </p>
        </div>
        <ManagerDashboardOverview />
      </div>
    </DashboardLayout>
  );
}

