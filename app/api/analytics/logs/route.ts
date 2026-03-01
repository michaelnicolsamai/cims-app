import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");
    const type = searchParams.get("type");

    const where: { ownerId: string; type?: string } = { ownerId: user.id };
    if (type && type.length > 0) {
      where.type = type as any;
    }

    const logs = await prisma.analyticsLog.findMany({
      where,
      orderBy: { generatedAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    console.error("Error fetching analytics logs:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch analytics logs" },
      { status: 500 }
    );
  }
}
