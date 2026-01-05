import { UserRole } from "@prisma/client";

/**
 * Get the dashboard base path for a specific role
 */
export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "/dashboard/admin";
    case "MANAGER":
      return "/dashboard/manager";
    case "STAFF":
      return "/dashboard/staff";
    default:
      return "/dashboard/admin";
  }
}

/**
 * Get role-specific routes for common pages
 */
export function getRoutes(role: UserRole) {
  const base = getDashboardPath(role);
  
  return {
    dashboard: base,
    customers: `${base}/customers`,
    customersAdd: `${base}/customers/add`,
    customersDetail: (id: string) => `${base}/customers/${id}`,
    customersInsights: (id: string) => `${base}/customers/${id}/insights`,
    products: `${base}/products`,
    productsAdd: `${base}/products/add`,
    sales: `${base}/sales`,
    salesAdd: `${base}/sales/add`,
    insights: {
      customers: `${base}/insights/customers`,
      sales: `${base}/insights/sales`,
      segments: `${base}/insights/segments`,
    },
    reports: `${base}/reports`,
    settings: `${base}/settings`,
    users: `${base}/users`,
  };
}

/**
 * Check if a role has access to a feature
 */
export function hasAccess(role: UserRole, feature: string): boolean {
  const accessMap: Record<UserRole, string[]> = {
    ADMIN: [
      "dashboard",
      "customers",
      "products",
      "sales",
      "insights",
      "reports",
      "settings",
      "users",
    ],
    MANAGER: [
      "dashboard",
      "customers",
      "products",
      "sales",
      "insights",
      "reports",
    ],
    STAFF: [
      "dashboard",
      "customers",
      "products",
      "sales",
      "insights_customers", // Only customer insights, not sales/segments
    ],
  };

  return accessMap[role]?.includes(feature) || false;
}

