import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ReportsView } from "@/components/reports/reports-view";

export const metadata = {
  title: "Reports | CIMS",
  description: "Generate and view business reports",
};

export default function ReportsPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <ReportsView />
      </div>
    </DashboardLayout>
  );
}

