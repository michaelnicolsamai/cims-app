import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CustomersView } from "@/components/customers/customers-view";

export const metadata = {
  title: "Customers | CIMS",
  description: "Manage your customers",
};

export default function CustomersPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <CustomersView />
      </div>
    </DashboardLayout>
  );
}

