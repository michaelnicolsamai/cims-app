import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { getCustomerInsights } from "@/lib/services/analytics/customer-insights.service";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const customerId = params.id;

    // Verify customer belongs to user
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        ownerId: user.id,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const insights = await getCustomerInsights(customerId);

    return NextResponse.json({ success: true, data: insights });
  } catch (error: any) {
    console.error("Error fetching customer insights:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch customer insights" },
      { status: 500 }
    );
  }
}

