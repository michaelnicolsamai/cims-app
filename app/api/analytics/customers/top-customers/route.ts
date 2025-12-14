import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { getTopCustomersInsights } from "@/lib/services/analytics/customer-insights.service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10");

    const insights = await getTopCustomersInsights(user.id, limit);

    return NextResponse.json({ success: true, data: insights });
  } catch (error: any) {
    console.error("Error fetching top customers:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch top customers" },
      { status: 500 }
    );
  }
}

