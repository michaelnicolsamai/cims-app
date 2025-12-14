import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProductsView } from "@/components/products/products-view";

export const metadata = {
  title: "Products | CIMS",
  description: "Manage your products",
};

export default function ProductsPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <ProductsView />
      </div>
    </DashboardLayout>
  );
}

