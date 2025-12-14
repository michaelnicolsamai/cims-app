"use client";

import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { Footer } from "./footer";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { UserRole } from "@prisma/client";

export function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // Close sidebar on mobile by default
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar userRole={session.user.role as UserRole} />
      <div className={`transition-all duration-300 ${sidebarOpen ? "lg:ml-64" : "ml-0"}`}>
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="pt-16 pb-20 min-h-screen">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}

