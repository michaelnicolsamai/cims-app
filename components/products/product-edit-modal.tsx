"use client";

import { useState, useEffect } from "react";
import { SlideModal } from "@/components/ui/slide-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, DollarSign, Box, Save, AlertCircle } from "lucide-react";
import { ProductStatus } from "@prisma/client";

interface Product {
  id: string;
  sku: string;
  name: string;
  barcode?: string | null;
  description?: string | null;
  category?: string | null;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  lowStockAlert: number;
  status: ProductStatus;
}

interface ProductEditModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  mode: "view" | "edit";
}

export function ProductEditModal({
  product,
  isOpen,
  onClose,
  onSave,
  mode: initialMode,
}: ProductEditModalProps) {
  const [mode, setMode] = useState<"view" | "edit">(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    description: "",
    costPrice: "",
    sellingPrice: "",
    currentStock: "",
    lowStockAlert: "",
    unit: "piece",
    status: ProductStatus.ACTIVE,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        sku: product.sku || "",
        category: product.category || "",
        description: product.description || "",
        costPrice: product.costPrice?.toString() || "",
        sellingPrice: product.sellingPrice?.toString() || "",
        currentStock: product.currentStock?.toString() || "",
        lowStockAlert: product.lowStockAlert?.toString() || "",
        unit: product.unit || "piece",
        status: product.status,
      });
      setMode(initialMode);
      setError(null);
    }
  }, [product, initialMode]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "view") return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/products/${product?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          sku: formData.sku,
          category: formData.category || null,
          description: formData.description || null,
          costPrice: parseFloat(formData.costPrice),
          sellingPrice: parseFloat(formData.sellingPrice),
          currentStock: parseInt(formData.currentStock),
          lowStockAlert: parseInt(formData.lowStockAlert),
          unit: formData.unit,
          status: formData.status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update product");
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  const footer = (
    <div className="flex items-center justify-end gap-3">
      {mode === "edit" && (
        <Button variant="outline" onClick={() => setMode("view")} disabled={loading}>
          Cancel
        </Button>
      )}
      {mode === "view" && (
        <Button onClick={() => setMode("edit")}>Edit Product</Button>
      )}
      {mode === "edit" && (
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Saving..." : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      )}
    </div>
  );

  return (
    <SlideModal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "view" ? `View Product: ${product.name}` : `Edit Product: ${product.name}`}
      footer={footer}
    >
      {error && (
        <Card className="border-red-200 bg-red-50 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Product Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={mode === "view" || loading}
                    className="text-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    SKU <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    disabled={mode === "view" || loading}
                    className="text-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Category</label>
                  <Input
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    disabled={mode === "view" || loading}
                    className="text-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Unit</label>
                  <Input
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    disabled={mode === "view" || loading}
                    className="text-gray-900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  disabled={mode === "view" || loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Pricing & Inventory
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Cost Price <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="costPrice"
                    type="number"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={handleChange}
                    disabled={mode === "view" || loading}
                    className="text-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Selling Price <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="sellingPrice"
                    type="number"
                    step="0.01"
                    value={formData.sellingPrice}
                    onChange={handleChange}
                    disabled={mode === "view" || loading}
                    className="text-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Current Stock <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="currentStock"
                    type="number"
                    value={formData.currentStock}
                    onChange={handleChange}
                    disabled={mode === "view" || loading}
                    className="text-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Low Stock Alert <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="lowStockAlert"
                    type="number"
                    value={formData.lowStockAlert}
                    onChange={handleChange}
                    disabled={mode === "view" || loading}
                    className="text-gray-900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={mode === "view" || loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={ProductStatus.ACTIVE}>Active</option>
                  <option value={ProductStatus.INACTIVE}>Inactive</option>
                  <option value={ProductStatus.DISCONTINUED}>Discontinued</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </SlideModal>
  );
}

