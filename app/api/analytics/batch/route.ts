import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/auth-helpers";
import { runBatchAnalytics, runBatchAnalyticsForAll } from "@/lib/services/analytics/batch-analytics.service";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { forAll } = body;

    if (forAll) {
      // Only admins can run batch analytics for all businesses
      await requireAdmin();
      const result = await runBatchAnalyticsForAll();
      return NextResponse.json({ success: true, data: result });
    } else {
      // Run batch analytics for current user's business
      const result = await runBatchAnalytics(user.id);
      return NextResponse.json({ success: true, data: result });
    }
  } catch (error: any) {
    console.error("Error running batch analytics:", error);
    return NextResponse.json(
      { error: error.message || "Failed to run batch analytics" },
      { status: 500 }
    );
  }
}

