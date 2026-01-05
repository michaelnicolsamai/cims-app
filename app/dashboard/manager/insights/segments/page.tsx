import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import { ManagerCustomerSegmentsContent } from "@/components/insights/manager-customer-segments-content";

export default async function ManagerCustomerSegmentsPage() {
  await requireRole([UserRole.MANAGER, UserRole.ADMIN]);

  return (
    <DashboardLayout>
      <ManagerCustomerSegmentsContent />
    </DashboardLayout>
  );
}

