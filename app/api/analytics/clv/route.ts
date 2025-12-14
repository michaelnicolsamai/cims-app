import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import {
  getCustomerCLV,
  getAverageCLV,
} from "@/lib/services/analytics/customer-lifetime-value.service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get("customerId");
    const averageAcquisitionCost = parseFloat(
      searchParams.get("acquisitionCost") || "0"
    );

    if (customerId) {
      // Get CLV for a specific customer
      const clv = await getCustomerCLV(customerId, averageAcquisitionCost);
      return NextResponse.json({ success: true, data: clv });
    } else {
      // Get average CLV statistics
      const stats = await getAverageCLV(user.id);
      return NextResponse.json({ success: true, data: stats });
    }
  } catch (error: any) {
    console.error("Error fetching CLV:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch CLV" },
      { status: 500 }
    );
  }
}

