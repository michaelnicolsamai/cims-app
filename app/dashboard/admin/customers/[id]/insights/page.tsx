import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import { CustomerDetailInsights } from "@/components/customers/customer-detail-insights";

export default async function AdminCustomerInsightsDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await requireRole([UserRole.ADMIN]);

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

