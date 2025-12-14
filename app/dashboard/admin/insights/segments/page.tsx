import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { requireAuth } from "@/lib/auth-helpers";
import { CustomerSegmentsView } from "@/components/insights/customer-segments-view";

export default async function CustomerSegmentsPage() {
  await requireAuth();

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Customer Segments
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            View and analyze customer segments
          </p>
        </div>
        <CustomerSegmentsView />
      </div>
    </DashboardLayout>
  );
}

