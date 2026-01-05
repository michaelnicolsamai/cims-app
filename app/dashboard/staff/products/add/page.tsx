import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AddProductForm } from "@/components/products/add-product-form";
import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";

export const metadata = {
  title: "Add Product | CIMS",
  description: "Add a new product to your inventory",
};

export default async function StaffAddProductPage() {
  await requireRole([UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN]);
  
  return (
    <DashboardLayout>
      <div className="p-6">
        <AddProductForm />
      </div>
    </DashboardLayout>
  );
}

