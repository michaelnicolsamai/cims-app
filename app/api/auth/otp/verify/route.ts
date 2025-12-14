import { NextRequest, NextResponse } from "next/server";
import { verifyOTP, incrementOTPAttempts, OTPPurpose } from "@/lib/otp";
import { z } from "zod";

const verifyOTPSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().length(6, "OTP code must be 6 digits"),
  purpose: z.enum(["REGISTRATION", "PASSWORD_RESET", "EMAIL_VERIFICATION"]),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = verifyOTPSchema.parse(body);

    const result = await verifyOTP(
      validatedData.email,
      validatedData.code,
      validatedData.purpose as OTPPurpose
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to verify OTP" },
        { status: 500 }
      );
    }

    if (!result.valid) {
      // Increment attempts for failed verification
      await incrementOTPAttempts(
        validatedData.email,
        validatedData.code,
        validatedData.purpose as OTPPurpose
      );
      return NextResponse.json(
        { error: result.error || "Invalid OTP code" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error verifying OTP:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify OTP" },
      { status: 500 }
    );
  }
}

