import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import { ChurnRiskView } from "@/components/insights/churn-risk-view";

export default async function AdminChurnRiskPage() {
  await requireRole([UserRole.ADMIN]);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Churn Prediction & Risk Indicators
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Churn probability scores and risk categories (high/medium/low) for fast managerial interpretation and proactive retention follow-up
          </p>
        </div>
        <ChurnRiskView />
      </div>
    </DashboardLayout>
  );
}
