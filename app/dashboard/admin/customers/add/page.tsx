import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AddCustomerForm } from "@/components/customers/add-customer-form";
import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";

export const metadata = {
  title: "Add Customer | CIMS",
  description: "Add a new customer to your database",
};

export default async function AdminAddCustomerPage() {
  await requireRole([UserRole.ADMIN]);
  
  return (
    <DashboardLayout>
      <div className="p-6">
        <AddCustomerForm />
      </div>
    </DashboardLayout>
  );
}

