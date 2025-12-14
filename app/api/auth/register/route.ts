import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendEmail, getVerificationEmailHtml } from "@/lib/email";
import { verifyOTP } from "@/lib/otp";
import crypto from "crypto";

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  businessName: z.string().min(2, "Business name is required"),
  phone: z.string().optional(),
  businessType: z.string().optional(),
  otpCode: z.string().length(6, "OTP code must be 6 digits"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Verify OTP
    const otpResult = await verifyOTP(
      validatedData.email,
      validatedData.otpCode,
      "REGISTRATION"
    );

    if (!otpResult.success || !otpResult.valid) {
      return NextResponse.json(
        { error: otpResult.error || "Invalid or expired OTP code" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Combine first and last name
    const fullName = `${validatedData.firstName} ${validatedData.lastName}`.trim();

    // Create user
    const user = await prisma.user.create({
      data: {
        name: fullName,
        email: validatedData.email,
        password: hashedPassword,
        businessName: validatedData.businessName,
        phone: validatedData.phone,
        businessType: validatedData.businessType,
        role: "ADMIN", // First user is admin
        isActive: true,
      },
    });

    // Create user settings
    await prisma.userSettings.create({
      data: {
        userId: user.id,
        currency: "SLL",
        timezone: "Africa/Freetown",
        dateFormat: "DD/MM/YYYY",
      },
    });

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token expires in 24 hours

    // Create verification token
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt,
      },
    });

    // Send verification email
    const emailResult = await sendEmail({
      to: user.email,
      subject: "Verify Your Email - CIMS",
      html: getVerificationEmailHtml(verificationToken, user.name),
    });

    if (!emailResult.success) {
      console.error("Failed to send verification email:", emailResult.error);
      // Don't fail registration if email fails, just log it
    }

    return NextResponse.json(
      {
        message: "User registered successfully. Please check your email to verify your account.",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 }
    );
  }
}

