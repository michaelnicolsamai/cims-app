"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Save,
  Package,
  DollarSign,
  AlertCircle,
  Box,
  Barcode,
  User,
  Upload,
  Image as ImageIcon,
  X,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { ProductStatus } from "@prisma/client";

export function AddProductForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    category: "",
    description: "",
    costPrice: "",
    sellingPrice: "",
    currentStock: "0",
    lowStockAlert: "10",
    unit: "piece",
    status: ProductStatus.ACTIVE,
    barcode: "",
    supplier: "",
  });

  // Predefined categories
  const categories = [
    "Electronics",
    "Clothing & Apparel",
    "Food & Beverages",
    "Home & Kitchen",
    "Health & Beauty",
    "Sports & Outdoors",
    "Books & Media",
    "Toys & Games",
    "Automotive",
    "Office Supplies",
    "Pet Supplies",
    "Baby Products",
    "Jewelry & Accessories",
    "Furniture",
    "Garden & Tools",
    "Electrical Supplies",
    "Building Materials",
    "Pharmaceuticals",
    "Stationery",
    "Other",
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    // Handle category selection
    if (name === "category") {
      if (value === "Other") {
        setShowCustomCategory(true);
        setFormData((prev) => ({
          ...prev,
          [name]: "",
        }));
      } else {
        setShowCustomCategory(false);
        setCustomCategory("");
        setFormData((prev) => ({
          ...prev,
          [name]: value,
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleCustomCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomCategory(value);
    setFormData((prev) => ({
      ...prev,
      category: value,
    }));
  };

  const handleAddCustomCategory = () => {
    if (customCategory.trim()) {
      setFormData((prev) => ({
        ...prev,
        category: customCategory.trim(),
      }));
      setShowCustomCategory(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
      if (!validImageTypes.includes(file.type)) {
        setError("Invalid file type. Please select an image file (JPEG, PNG, WebP, or GIF).");
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setError("File size exceeds 5MB limit. Please select a smaller image.");
        return;
      }

      setSelectedImage(file);
      setError(null);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // First, create the product
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          costPrice: parseFloat(formData.costPrice) || 0,
          sellingPrice: parseFloat(formData.sellingPrice) || 0,
          currentStock: parseInt(formData.currentStock) || 0,
          lowStockAlert: parseInt(formData.lowStockAlert) || 10,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create product");
      }

      const productId = data.data.id;

      // If an image was selected, upload it
      if (selectedImage && productId) {
        setUploadingImage(true);
        try {
          const formData = new FormData();
          formData.append("file", selectedImage);

          const imageResponse = await fetch(`/api/products/${productId}/image`, {
            method: "POST",
            body: formData,
          });

          const imageData = await imageResponse.json();

          if (!imageResponse.ok) {
            console.error("Failed to upload image:", imageData.error);
            // Don't fail the whole operation if image upload fails
            // Product is already created, just log the error
          }
        } catch (imageErr: any) {
          console.error("Error uploading image:", imageErr);
          // Don't fail the whole operation if image upload fails
        } finally {
          setUploadingImage(false);
        }
      }

      // Redirect to products page
      router.push("/dashboard/admin/products");
    } catch (err: any) {
      setError(err.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  const calculateProfitMargin = () => {
    const cost = parseFloat(formData.costPrice) || 0;
    const selling = parseFloat(formData.sellingPrice) || 0;
    if (cost === 0) return 0;
    return ((selling - cost) / cost) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/admin/products">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add Product</h1>
            <p className="text-gray-600 mt-1">
              Add a new product to your inventory
            </p>
          </div>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="sku" className="text-sm font-medium text-gray-700">
                      SKU <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        id="sku"
                        name="sku"
                        type="text"
                        placeholder="PROD-001"
                        value={formData.sku}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        className="text-gray-900"
                      />
                      <Barcode className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Enter product name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="text-gray-900"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="category" className="text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={showCustomCategory ? "Other" : formData.category}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {showCustomCategory && (
                    <div className="flex gap-2 mt-2">
                      <Input
                        type="text"
                        placeholder="Enter custom category"
                        value={customCategory}
                        onChange={handleCustomCategoryChange}
                        disabled={loading}
                        className="text-gray-900"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCustomCategory();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddCustomCategory}
                        disabled={loading || !customCategory.trim()}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    placeholder="Enter product description"
                    value={formData.description}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="image" className="text-sm font-medium text-gray-700">
                    Product Image
                  </label>
                  {!imagePreview ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                      <input
                        type="file"
                        id="image"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                        onChange={handleImageSelect}
                        disabled={loading}
                        className="hidden"
                      />
                      <label
                        htmlFor="image"
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, WebP, GIF up to 5MB
                        </p>
                      </label>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="relative w-full h-64 rounded-lg overflow-hidden border border-gray-300">
                        <img
                          src={imagePreview}
                          alt="Product preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          disabled={loading}
                          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {selectedImage?.name} ({(selectedImage?.size || 0) / 1024 / 1024} MB)
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="costPrice" className="text-sm font-medium text-gray-700">
                      Cost Price <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="costPrice"
                      name="costPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.costPrice}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="text-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="sellingPrice" className="text-sm font-medium text-gray-700">
                      Selling Price <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="sellingPrice"
                      name="sellingPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.sellingPrice}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="text-gray-900"
                    />
                  </div>
                </div>

                {formData.costPrice && formData.sellingPrice && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Profit Margin</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {calculateProfitMargin().toFixed(2)}%
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Inventory */}
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <Box className="w-5 h-5" />
                  Inventory
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="currentStock" className="text-sm font-medium text-gray-700">
                      Initial Stock <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="currentStock"
                      name="currentStock"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.currentStock}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="text-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="lowStockAlert" className="text-sm font-medium text-gray-700">
                      Low Stock Alert <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="lowStockAlert"
                      name="lowStockAlert"
                      type="number"
                      min="0"
                      placeholder="10"
                      value={formData.lowStockAlert}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="text-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="unit" className="text-sm font-medium text-gray-700">
                      Unit <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="unit"
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="piece">Piece</option>
                      <option value="kg">Kilogram (kg)</option>
                      <option value="g">Gram (g)</option>
                      <option value="liter">Liter</option>
                      <option value="ml">Milliliter (ml)</option>
                      <option value="pack">Pack</option>
                      <option value="box">Box</option>
                      <option value="carton">Carton</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <Barcode className="w-5 h-5" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="barcode" className="text-sm font-medium text-gray-700">
                      Barcode
                    </label>
                    <Input
                      id="barcode"
                      name="barcode"
                      type="text"
                      placeholder="Enter barcode"
                      value={formData.barcode}
                      onChange={handleChange}
                      disabled={loading}
                      className="text-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="supplier" className="text-sm font-medium text-gray-700">
                      Supplier
                    </label>
                    <div className="relative">
                      <Input
                        id="supplier"
                        name="supplier"
                        type="text"
                        placeholder="Enter supplier name"
                        value={formData.supplier}
                        onChange={handleChange}
                        disabled={loading}
                        className="text-gray-900"
                      />
                      <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="status" className="text-sm font-medium text-gray-700">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={ProductStatus.ACTIVE}>Active</option>
                    <option value={ProductStatus.INACTIVE}>Inactive</option>
                    <option value={ProductStatus.DISCONTINUED}>Discontinued</option>
                    <option value={ProductStatus.OUT_OF_STOCK}>Out of Stock</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-gray-900">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Product Name</p>
                  <p className="font-medium text-gray-900">
                    {formData.name || "—"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">SKU</p>
                  <p className="font-medium text-gray-900 font-mono">
                    {formData.sku || "—"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Category</p>
                  <p className="font-medium text-gray-900">
                    {formData.category || "—"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Initial Stock</p>
                  <p className="font-medium text-gray-900">
                    {formData.currentStock} {formData.unit}
                  </p>
                </div>
                {formData.costPrice && formData.sellingPrice && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Profit per Unit</p>
                    <p className="text-lg font-bold text-gray-900">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "SLL",
                        minimumFractionDigits: 0,
                      }).format(
                        parseFloat(formData.sellingPrice) -
                          parseFloat(formData.costPrice)
                      )}
                    </p>
                  </div>
                )}
                {imagePreview && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Product Image</p>
                    <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-300">
                      <img
                        src={imagePreview}
                        alt="Product preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
                <div className="pt-4 border-t border-gray-200">
                  <Button
                    type="submit"
                    disabled={loading || uploadingImage}
                    className="w-full"
                    size="lg"
                  >
                    {loading || uploadingImage ? (
                      uploadingImage ? (
                        "Uploading image..."
                      ) : (
                        "Saving..."
                      )
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Product
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

