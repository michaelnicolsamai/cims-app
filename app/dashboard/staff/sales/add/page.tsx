import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AddSaleForm } from "@/components/sales/add-sale-form";
import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";

export const metadata = {
  title: "New Sale | CIMS",
  description: "Create a new sales transaction",
};

export default async function StaffAddSalePage() {
  await requireRole([UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN]);
  
  return (
    <DashboardLayout>
      <div className="p-6">
        <AddSaleForm />
      </div>
    </DashboardLayout>
  );
}

