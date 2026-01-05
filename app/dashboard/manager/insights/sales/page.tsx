import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import { ManagerSalesAnalyticsContent } from "@/components/insights/manager-sales-analytics-content";

export default async function ManagerSalesAnalyticsPage() {
  await requireRole([UserRole.MANAGER, UserRole.ADMIN]);

  return (
    <DashboardLayout>
      <ManagerSalesAnalyticsContent />
    </DashboardLayout>
  );
}

