"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  BarChart3,
  Package,
  ShoppingCart,
  Settings,
  FileText,
  UserCog,
} from "lucide-react";
import { UserRole } from "@prisma/client";

interface SidebarProps {
  userRole: UserRole;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    href: "/dashboard/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN"],
  },
  {
    href: "/dashboard/manager",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["MANAGER"],
  },
  {
    href: "/dashboard/staff",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["STAFF"],
  },
  {
    href: "/dashboard/admin/insights/customers",
    label: "Customer Insights",
    icon: Users,
    roles: ["ADMIN", "MANAGER", "STAFF"],
  },
  {
    href: "/dashboard/admin/insights/sales",
    label: "Sales Analytics",
    icon: TrendingUp,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    href: "/dashboard/admin/insights/segments",
    label: "Segments",
    icon: BarChart3,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    href: "/dashboard/admin/customers",
    label: "Customers",
    icon: Users,
    roles: ["ADMIN", "MANAGER", "STAFF"],
  },
  {
    href: "/dashboard/admin/products",
    label: "Products",
    icon: Package,
    roles: ["ADMIN", "MANAGER", "STAFF"],
  },
  {
    href: "/dashboard/admin/sales",
    label: "Sales",
    icon: ShoppingCart,
    roles: ["ADMIN", "MANAGER", "STAFF"],
  },
  {
    href: "/dashboard/admin/reports",
    label: "Reports",
    icon: FileText,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    href: "/dashboard/admin/settings",
    label: "Settings",
    icon: Settings,
    roles: ["ADMIN"],
  },
  {
    href: "/dashboard/admin/users",
    label: "User Management",
    icon: UserCog,
    roles: ["ADMIN"],
  },
];

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const filteredItems = navItems.filter((item) => item.roles.includes(userRole));

  const getDashboardUrl = () => {
    if (userRole === "ADMIN") return "/dashboard/admin";
    if (userRole === "MANAGER") return "/dashboard/manager";
    return "/dashboard/staff";
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 overflow-y-auto z-20 lg:z-10">
      <div className="p-6">
        <Link href={getDashboardUrl()} className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <span className="text-xl font-bold text-gray-900">CIMS</span>
        </Link>
      </div>

      <nav className="px-4 space-y-1">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-blue-600" : "text-gray-400")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500">
          <div className="font-medium text-gray-700 mb-1">Role: {userRole}</div>
          <div>Version 1.0.0</div>
        </div>
      </div>
    </aside>
  );
}

