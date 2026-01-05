import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ReportsView } from "@/components/reports/reports-view";
import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";

export const metadata = {
  title: "Reports | CIMS",
  description: "Generate and view business reports",
};

export default async function ManagerReportsPage() {
  await requireRole([UserRole.MANAGER, UserRole.ADMIN]);
  
  return (
    <DashboardLayout>
      <div className="p-6">
        <ReportsView />
      </div>
    </DashboardLayout>
  );
}

