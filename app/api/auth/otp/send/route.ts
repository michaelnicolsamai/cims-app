import { NextRequest, NextResponse } from "next/server";
import { sendOTP, OTPPurpose } from "@/lib/otp";
import { z } from "zod";

const sendOTPSchema = z.object({
  email: z.string().email("Invalid email address"),
  purpose: z.enum(["REGISTRATION", "PASSWORD_RESET", "EMAIL_VERIFICATION"]),
  name: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = sendOTPSchema.parse(body);

    const result = await sendOTP(
      validatedData.email,
      validatedData.purpose as OTPPurpose,
      validatedData.name
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send OTP" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      expiresAt: result.expiresAt,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error sending OTP:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send OTP" },
      { status: 500 }
    );
  }
}

