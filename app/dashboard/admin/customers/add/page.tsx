import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AddCustomerForm } from "@/components/customers/add-customer-form";

export const metadata = {
  title: "Add Customer | CIMS",
  description: "Add a new customer to your database",
};

export default function AddCustomerPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <AddCustomerForm />
      </div>
    </DashboardLayout>
  );
}

