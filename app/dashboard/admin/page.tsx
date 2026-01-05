import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";

export default async function AdminDashboardPage() {
  await requireRole([UserRole.ADMIN]);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Complete overview of your business insights, analytics, and customer management
          </p>
        </div>
        <DashboardOverview />
      </div>
    </DashboardLayout>
  );
}

