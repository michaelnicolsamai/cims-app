import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import { ManagerCustomerInsightsContent } from "@/components/insights/manager-customer-insights-content";

export default async function ManagerCustomerInsightsPage() {
  await requireRole([UserRole.MANAGER, UserRole.ADMIN]);

  return (
    <DashboardLayout>
      <ManagerCustomerInsightsContent />
    </DashboardLayout>
  );
}

