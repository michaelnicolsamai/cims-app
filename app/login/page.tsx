"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { UserRole } from "@prisma/client";

function getDashboardPath(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return "/dashboard/admin";
    case UserRole.MANAGER:
      return "/dashboard/manager";
    case UserRole.STAFF:
      return "/dashboard/staff";
    default:
      return "/dashboard/admin";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    const registeredParam = searchParams.get("registered");
    if (registeredParam === "true") {
      setRegistered(true);
    }
  }, [searchParams]);

  // Redirect if already logged in
  useEffect(() => {
    if (session?.user?.role) {
      const dashboardPath = getDashboardPath(session.user.role as UserRole);
      router.push(dashboardPath);
    }
  }, [session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else if (result?.ok) {
        // Redirect to /dashboard which will handle role-based routing
        // This prevents unauthorized redirects
        router.push("/dashboard");
        router.refresh();
        // Loading state will be reset by the navigation
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Customer Insight Management System
          </h1>
          <p className="text-gray-600">Sign in to access your dashboard</p>
        </div>

        <Card className="border border-gray-200 shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-semibold text-center text-gray-900">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Enter your credentials to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {registered && (
                <div className="p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md">
                  Registration successful! Please sign in.
                </div>
              )}
              {error && (
                <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-10 pr-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium" 
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-6 space-y-2 text-center">
              <p className="text-sm">
                <Link href="/forgot-password" className="text-blue-600 hover:text-blue-700 font-medium">
                  Forgot your password?
                </Link>
              </p>
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <Card className="mt-6 border border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Demo Login Credentials
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Use these credentials to test the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Admin */}
              <div className="p-3 bg-white rounded border border-blue-100 hover:shadow-sm transition-shadow">
                <p className="text-xs font-semibold text-blue-600 uppercase mb-1.5">Admin</p>
                <p className="text-sm font-medium text-gray-900 mb-1 break-words">mohamed@sunriseelectronics.com</p>
                <p className="text-xs text-gray-600">Password: <span className="font-mono">password123</span></p>
              </div>

              {/* Manager */}
              <div className="p-3 bg-white rounded border border-blue-100 hover:shadow-sm transition-shadow">
                <p className="text-xs font-semibold text-purple-600 uppercase mb-1.5">Manager</p>
                <p className="text-sm font-medium text-gray-900 mb-1">manager@demo.com</p>
                <p className="text-xs text-gray-600">Password: <span className="font-mono">password123</span></p>
              </div>

              {/* Staff */}
              <div className="p-3 bg-white rounded border border-blue-100 hover:shadow-sm transition-shadow">
                <p className="text-xs font-semibold text-green-600 uppercase mb-1.5">Staff</p>
                <p className="text-sm font-medium text-gray-900 mb-1">staff@demo.com</p>
                <p className="text-xs text-gray-600">Password: <span className="font-mono">password123</span></p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>© 2025 Customer Insight Management System. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
