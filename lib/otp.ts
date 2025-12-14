import { prisma } from "./db";
import { sendEmail } from "./email";

// Generate a 6-digit OTP code
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// OTP expiration time (10 minutes)
const OTP_EXPIRY_MINUTES = 10;

export type OTPPurpose = "REGISTRATION" | "PASSWORD_RESET" | "EMAIL_VERIFICATION";

export interface SendOTPResult {
  success: boolean;
  error?: string;
  expiresAt?: Date;
}

export async function sendOTP(
  email: string,
  purpose: OTPPurpose,
  name?: string
): Promise<SendOTPResult> {
  try {
    // Delete any existing unverified OTPs for this email and purpose
    await prisma.oTP.deleteMany({
      where: {
        email,
        purpose,
        verified: false,
        expiresAt: {
          lt: new Date(), // Also delete expired ones
        },
      },
    });

    // Generate new OTP
    const code = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

    // Save OTP to database
    await prisma.oTP.create({
      data: {
        email,
        code,
        purpose,
        expiresAt,
      },
    });

    // Send OTP via email
    const emailResult = await sendEmail({
      to: email,
      subject: `Your Verification Code - CIMS`,
      html: getOTPEmailHtml(code, purpose, name || "User"),
    });

    if (!emailResult.success) {
      // Delete the OTP if email failed
      await prisma.oTP.deleteMany({
        where: { email, code, purpose },
      });
      return {
        success: false,
        error: emailResult.error || "Failed to send OTP email",
      };
    }

    return {
      success: true,
      expiresAt,
    };
  } catch (error: any) {
    console.error("Error sending OTP:", error);
    return {
      success: false,
      error: error.message || "Failed to send OTP",
    };
  }
}

export interface VerifyOTPResult {
  success: boolean;
  error?: string;
  valid?: boolean;
}

export async function verifyOTP(
  email: string,
  code: string,
  purpose: OTPPurpose
): Promise<VerifyOTPResult> {
  try {
    // Find OTP
    const otp = await prisma.oTP.findFirst({
      where: {
        email,
        code,
        purpose,
        verified: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otp) {
      return {
        success: true,
        valid: false,
        error: "Invalid OTP code",
      };
    }

    // Check if expired
    if (new Date() > otp.expiresAt) {
      await prisma.oTP.update({
        where: { id: otp.id },
        data: { verified: true }, // Mark as used so it can't be reused
      });
      return {
        success: true,
        valid: false,
        error: "OTP code has expired. Please request a new one.",
      };
    }

    // Check attempts (max 5 attempts)
    if (otp.attempts >= 5) {
      await prisma.oTP.update({
        where: { id: otp.id },
        data: { verified: true }, // Mark as used
      });
      return {
        success: true,
        valid: false,
        error: "Too many failed attempts. Please request a new OTP.",
      };
    }

    // Verify OTP
    await prisma.oTP.update({
      where: { id: otp.id },
      data: {
        verified: true,
        attempts: otp.attempts + 1,
      },
    });

    return {
      success: true,
      valid: true,
    };
  } catch (error: any) {
    console.error("Error verifying OTP:", error);
    return {
      success: false,
      error: error.message || "Failed to verify OTP",
    };
  }
}

// Increment attempt counter for failed verifications
export async function incrementOTPAttempts(
  email: string,
  code: string,
  purpose: OTPPurpose
): Promise<void> {
  try {
    const otp = await prisma.oTP.findFirst({
      where: {
        email,
        code,
        purpose,
        verified: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (otp) {
      await prisma.oTP.update({
        where: { id: otp.id },
        data: {
          attempts: otp.attempts + 1,
        },
      });
    }
  } catch (error) {
    console.error("Error incrementing OTP attempts:", error);
  }
}

function getOTPEmailHtml(code: string, purpose: OTPPurpose, name: string): string {
  const purposeText =
    purpose === "REGISTRATION"
      ? "complete your registration"
      : purpose === "PASSWORD_RESET"
      ? "reset your password"
      : "verify your email";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Verification Code</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Verification Code</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333;">Hello ${name},</h2>
        <p>Your verification code to ${purposeText} is:</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="background: white; border: 2px dashed #667eea; padding: 20px; border-radius: 10px; display: inline-block;">
            <h1 style="color: #667eea; font-size: 36px; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">${code}</h1>
          </div>
        </div>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">This code will expire in ${OTP_EXPIRY_MINUTES} minutes.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} CIMS. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}

