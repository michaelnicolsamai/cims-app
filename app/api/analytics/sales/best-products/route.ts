import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { getBestSellingProducts } from "@/lib/services/analytics/sales-analytics.service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    
    const limit = parseInt(searchParams.get("limit") || "10");
    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : undefined;
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : undefined;

    const products = await getBestSellingProducts(user.id, limit, startDate, endDate);

    return NextResponse.json({ success: true, data: products });
  } catch (error: any) {
    console.error("Error fetching best selling products:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch best selling products" },
      { status: 500 }
    );
  }
}

