import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SalesView } from "@/components/sales/sales-view";
import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";

export const metadata = {
  title: "Sales | CIMS",
  description: "Manage your sales transactions",
};

export default async function ManagerSalesPage() {
  await requireRole([UserRole.MANAGER, UserRole.ADMIN]);
  
  return (
    <DashboardLayout>
      <div className="p-6">
        <SalesView />
      </div>
    </DashboardLayout>
  );
}

