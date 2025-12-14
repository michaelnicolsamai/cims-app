import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { segmentCustomers } from "@/lib/services/analytics/customer-segmentation.service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const segments = await segmentCustomers(user.id);

    return NextResponse.json({ success: true, data: segments });
  } catch (error: any) {
    console.error("Error fetching customer segments:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch customer segments" },
      { status: 500 }
    );
  }
}

