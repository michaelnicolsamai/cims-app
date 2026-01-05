"use client";

import { useSession } from "next-auth/react";
import { UserRole } from "@prisma/client";
import { getRoutes } from "@/lib/routes";

/**
 * Hook to get role-aware routes in client components
 */
export function useRoutes() {
  const { data: session } = useSession();
  const role = (session?.user?.role as UserRole) || "STAFF";
  return getRoutes(role);
}

