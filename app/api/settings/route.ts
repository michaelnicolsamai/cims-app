import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Get or create user settings
    let userSettings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
    });

    if (!userSettings) {
      // Create default settings
      userSettings = await prisma.userSettings.create({
        data: {
          userId: user.id,
          currency: "SLL",
          timezone: "Africa/Freetown",
          dateFormat: "DD/MM/YYYY",
          emailNotifications: true,
          lowStockAlerts: true,
          paymentReminders: true,
          smsNotifications: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: userSettings,
    });
  } catch (error: any) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const {
      currency,
      timezone,
      dateFormat,
      emailNotifications,
      lowStockAlerts,
      paymentReminders,
      smsNotifications,
    } = body;

    // Update or create user settings
    const userSettings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: {
        currency: currency || undefined,
        timezone: timezone || undefined,
        dateFormat: dateFormat || undefined,
        emailNotifications: emailNotifications !== undefined ? emailNotifications : undefined,
        lowStockAlerts: lowStockAlerts !== undefined ? lowStockAlerts : undefined,
        paymentReminders: paymentReminders !== undefined ? paymentReminders : undefined,
        smsNotifications: smsNotifications !== undefined ? smsNotifications : undefined,
      },
      create: {
        userId: user.id,
        currency: currency || "SLL",
        timezone: timezone || "Africa/Freetown",
        dateFormat: dateFormat || "DD/MM/YYYY",
        emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
        lowStockAlerts: lowStockAlerts !== undefined ? lowStockAlerts : true,
        paymentReminders: paymentReminders !== undefined ? paymentReminders : true,
        smsNotifications: smsNotifications !== undefined ? smsNotifications : false,
      },
    });

    return NextResponse.json({
      success: true,
      data: userSettings,
    });
  } catch (error: any) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}

