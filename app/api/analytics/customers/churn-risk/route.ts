import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { getHighChurnRiskCustomers } from "@/lib/services/analytics/churn-risk.service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const minRiskLevel = (searchParams.get("minRiskLevel") || "MEDIUM") as
      | "LOW"
      | "MEDIUM"
      | "HIGH"
      | "CRITICAL";

    const customers = await getHighChurnRiskCustomers(user.id, minRiskLevel);

    return NextResponse.json({ success: true, data: customers });
  } catch (error: any) {
    console.error("Error fetching churn risk customers:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch churn risk customers" },
      { status: 500 }
    );
  }
}

