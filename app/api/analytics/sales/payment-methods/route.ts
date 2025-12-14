import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { getPaymentMethodAnalysis } from "@/lib/services/analytics/sales-analytics.service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    
    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : undefined;
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : undefined;

    const analysis = await getPaymentMethodAnalysis(user.id, startDate, endDate);

    return NextResponse.json({ success: true, data: analysis });
  } catch (error: any) {
    console.error("Error fetching payment methods analysis:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch payment methods analysis" },
      { status: 500 }
    );
  }
}

