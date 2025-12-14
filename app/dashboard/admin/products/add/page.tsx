import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AddProductForm } from "@/components/products/add-product-form";

export const metadata = {
  title: "Add Product | CIMS",
  description: "Add a new product to your inventory",
};

export default function AddProductPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <AddProductForm />
      </div>
    </DashboardLayout>
  );
}

