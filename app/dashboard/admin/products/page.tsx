import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProductsView } from "@/components/products/products-view";
import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";

export const metadata = {
  title: "Products | CIMS",
  description: "Manage your products",
};

export default async function AdminProductsPage() {
  await requireRole([UserRole.ADMIN]);
  
  return (
    <DashboardLayout>
      <div className="p-6">
        <ProductsView />
      </div>
    </DashboardLayout>
  );
}

