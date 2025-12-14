import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { requireAuth } from "@/lib/auth-helpers";
import { SalesAnalyticsView } from "@/components/insights/sales-analytics-view";

export default async function SalesAnalyticsPage() {
  await requireAuth();

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Sales Analytics
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Analyze sales trends, forecasts, and performance metrics
          </p>
        </div>
        <SalesAnalyticsView />
      </div>
    </DashboardLayout>
  );
}

