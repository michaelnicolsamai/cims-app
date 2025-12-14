import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { getSalesTrends } from "@/lib/services/analytics/sales-analytics.service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const months = parseInt(searchParams.get("months") || "12");

    const trends = await getSalesTrends(user.id, months);

    return NextResponse.json({ success: true, data: trends });
  } catch (error: any) {
    console.error("Error fetching sales trends:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch sales trends" },
      { status: 500 }
    );
  }
}

