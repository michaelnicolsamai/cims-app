import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SalesView } from "@/components/sales/sales-view";

export const metadata = {
  title: "Sales | CIMS",
  description: "Manage your sales transactions",
};

export default function SalesPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <SalesView />
      </div>
    </DashboardLayout>
  );
}

