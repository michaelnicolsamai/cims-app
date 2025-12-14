import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { requireAuth } from "@/lib/auth-helpers";
import { CustomerDetailInsights } from "@/components/customers/customer-detail-insights";

export default async function CustomerInsightsDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAuth();

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Customer Insights
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Detailed analysis for this customer
          </p>
        </div>
        <CustomerDetailInsights customerId={params.id} />
      </div>
    </DashboardLayout>
  );
}

