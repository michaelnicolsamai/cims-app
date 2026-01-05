import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import { StaffCustomerInsightsContent } from "@/components/insights/staff-customer-insights-content";

export default async function StaffCustomerInsightsPage() {
  await requireRole([UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN]);

  return (
    <DashboardLayout>
      <StaffCustomerInsightsContent />
    </DashboardLayout>
  );
}

