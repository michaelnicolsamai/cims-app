import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import {
  generateAutomatedInsights,
  generateAndSaveInsights,
} from "@/lib/services/analytics/automated-insights.service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const insights = await generateAutomatedInsights(user.id);
    return NextResponse.json({ success: true, data: insights });
  } catch (error: any) {
    console.error("Error generating automated insights:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate insights" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const insights = await generateAndSaveInsights(user.id);
    return NextResponse.json({
      success: true,
      data: insights,
      message: "Insights generated and saved successfully",
    });
  } catch (error: any) {
    console.error("Error generating and saving insights:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate and save insights" },
      { status: 500 }
    );
  }
}

