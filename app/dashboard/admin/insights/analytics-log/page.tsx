import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import { AnalyticsLogView } from "@/components/insights/analytics-log-view";

export default async function AdminAnalyticsLogPage() {
  await requireRole([UserRole.ADMIN]);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Analytics History & Insight Logs
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Executed analyses, timestamps, and stored outputs for traceability and transparency
          </p>
        </div>
        <AnalyticsLogView />
      </div>
    </DashboardLayout>
  );
}
