import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { requireAuth } from "@/lib/auth-helpers";
import { CustomerInsightsView } from "@/components/insights/customer-insights-view";

export default async function CustomerInsightsPage() {
  await requireAuth();

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Customer Insights
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Comprehensive analysis of your customer base
          </p>
        </div>
        <CustomerInsightsView />
      </div>
    </DashboardLayout>
  );
}

