import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { forecastRevenue } from "@/lib/services/analytics/revenue-forecast.service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const monthsAhead = parseInt(searchParams.get("monthsAhead") || "6");
    const historicalMonths = parseInt(searchParams.get("historicalMonths") || "12");

    const forecast = await forecastRevenue(user.id, monthsAhead, historicalMonths);

    return NextResponse.json({ success: true, data: forecast });
  } catch (error: any) {
    console.error("Error generating revenue forecast:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate revenue forecast" },
      { status: 500 }
    );
  }
}

