import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import { StaffDashboardOverview } from "@/components/dashboard/staff-dashboard-overview";

export default async function StaffDashboardPage() {
  await requireRole([UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN]);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Staff Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Daily operations and quick access to essential tools
          </p>
        </div>
        <StaffDashboardOverview />
      </div>
    </DashboardLayout>
  );
}

