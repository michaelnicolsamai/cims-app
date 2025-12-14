"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const emailParam = searchParams.get("email");

  const [status, setStatus] = useState<"loading" | "success" | "error" | "idle">("idle");
  const [message, setMessage] = useState<string>("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else {
      setStatus("error");
      setMessage("Invalid verification link. Please request a new verification email.");
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    setStatus("loading");
    try {
      const response = await fetch(`/api/auth/verify-email?token=${verificationToken}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify email");
      }

      setStatus("success");
      setMessage(data.message || "Email verified successfully!");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Failed to verify email");
    }
  };

  const resendVerification = async () => {
    setResending(true);
    try {
      // Get email from URL or prompt user
      const email = emailParam || prompt("Please enter your email address:");
      if (!email) {
        setResending(false);
        return;
      }

      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send verification email");
      }

      alert("Verification email sent! Please check your inbox.");
    } catch (err: any) {
      alert(err.message || "Failed to send verification email");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Email Verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          {status === "loading" && (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              </div>
              <p className="text-gray-600">Verifying your email...</p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Email Verified!</h2>
              <p className="text-gray-600">{message}</p>
              <Button onClick={() => router.push("/login")} className="w-full">
                Go to Login
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center p-4 bg-red-50 rounded-lg">
                <AlertCircle className="w-12 h-12 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Verification Failed</h2>
              <p className="text-gray-600">{message}</p>
              <div className="space-y-2">
                <Button
                  onClick={resendVerification}
                  disabled={resending}
                  variant="outline"
                  className="w-full"
                >
                  {resending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Resend Verification Email
                    </>
                  )}
                </Button>
                <Button onClick={() => router.push("/login")} className="w-full">
                  Go to Login
                </Button>
              </div>
            </div>
          )}

          {status === "idle" && (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
                <Mail className="w-12 h-12 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Check Your Email</h2>
              <p className="text-gray-600">
                {emailParam 
                  ? `We've sent a verification link to ${emailParam}. Please check your inbox and click the link to verify your email.`
                  : "Please check your email for the verification link."
                }
              </p>
              {emailParam && (
                <Button
                  onClick={resendVerification}
                  disabled={resending}
                  variant="outline"
                  className="w-full"
                >
                  {resending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Resend Verification Email
                    </>
                  )}
                </Button>
              )}
              <Button onClick={() => router.push("/login")} className="w-full">
                Go to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

