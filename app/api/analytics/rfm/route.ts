import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { getAllCustomersRFMAnalysis, getCustomerRFMAnalysis } from "@/lib/services/analytics/rfm-analysis.service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get("customerId");

    if (customerId) {
      // Get RFM analysis for a specific customer
      const analysis = await getCustomerRFMAnalysis(customerId);
      return NextResponse.json({ success: true, data: analysis });
    } else {
      // Get RFM analysis for all customers
      const analyses = await getAllCustomersRFMAnalysis(user.id);
      return NextResponse.json({ success: true, data: analyses });
    }
  } catch (error: any) {
    console.error("Error fetching RFM analysis:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch RFM analysis" },
      { status: 500 }
    );
  }
}

