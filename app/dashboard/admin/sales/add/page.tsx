import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AddSaleForm } from "@/components/sales/add-sale-form";

export const metadata = {
  title: "New Sale | CIMS",
  description: "Create a new sales transaction",
};

export default function AddSalePage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <AddSaleForm />
      </div>
    </DashboardLayout>
  );
}

