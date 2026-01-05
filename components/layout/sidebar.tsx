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
import { getRoutes } from "@/lib/routes";

interface SidebarProps {
  userRole: UserRole;
}

interface NavItem {
  getHref: (role: UserRole) => string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    getHref: (role) => getRoutes(role).dashboard,
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "MANAGER", "STAFF"],
  },
  {
    getHref: (role) => getRoutes(role).insights.customers,
    label: "Customer Insights",
    icon: Users,
    roles: ["ADMIN", "MANAGER", "STAFF"],
  },
  {
    getHref: (role) => getRoutes(role).insights.sales,
    label: "Sales Analytics",
    icon: TrendingUp,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    getHref: (role) => getRoutes(role).insights.segments,
    label: "Segments",
    icon: BarChart3,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    getHref: (role) => getRoutes(role).customers,
    label: "Customers",
    icon: Users,
    roles: ["ADMIN", "MANAGER", "STAFF"],
  },
  {
    getHref: (role) => getRoutes(role).products,
    label: "Products",
    icon: Package,
    roles: ["ADMIN", "MANAGER", "STAFF"],
  },
  {
    getHref: (role) => getRoutes(role).sales,
    label: "Sales",
    icon: ShoppingCart,
    roles: ["ADMIN", "MANAGER", "STAFF"],
  },
  {
    getHref: (role) => getRoutes(role).reports,
    label: "Reports",
    icon: FileText,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    getHref: (role) => getRoutes(role).settings,
    label: "Settings",
    icon: Settings,
    roles: ["ADMIN"],
  },
  {
    getHref: (role) => getRoutes(role).users,
    label: "User Management",
    icon: UserCog,
    roles: ["ADMIN"],
  },
];

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const routes = getRoutes(userRole);
  const filteredItems = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 overflow-y-auto z-20 lg:z-10">
      <div className="p-6">
        <Link href={routes.dashboard} className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <span className="text-xl font-bold text-gray-900">CIMS</span>
        </Link>
      </div>

      <nav className="px-4 space-y-1">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const href = item.getHref(userRole);
          const isActive = pathname === href || pathname.startsWith(href + "/");
          
          return (
            <Link
              key={href}
              href={href}
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

