import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CustomersView } from "@/components/customers/customers-view";
import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";

export const metadata = {
  title: "Customers | CIMS",
  description: "Manage your customers",
};

export default async function AdminCustomersPage() {
  await requireRole([UserRole.ADMIN]);
  
  return (
    <DashboardLayout>
      <div className="p-6">
        <CustomersView />
      </div>
    </DashboardLayout>
  );
}

