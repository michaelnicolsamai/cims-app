"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Package,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Box,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  X,
  CheckCircle2,
  XCircle,
  MinusCircle,
} from "lucide-react";
import Link from "next/link";
import { ProductStatus } from "@prisma/client";

interface Product {
  id: string;
  sku: string;
  name: string;
  category?: string | null;
  description?: string | null;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  lowStockAlert: number;
  unit: string;
  status: ProductStatus;
  barcode?: string | null;
  supplier?: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    saleItems: number;
  };
}

interface ProductsResponse {
  success: boolean;
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    totalProducts: number;
    totalInventoryValue: number;
    averageSellingPrice: number;
    averageCostPrice: number;
    lowStockCount: number;
    outOfStockCount: number;
    activeCount: number;
  };
}

export function ProductsView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalInventoryValue: 0,
    averageSellingPrice: 0,
    averageCostPrice: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    activeCount: 0,
  });
  const [filters, setFilters] = useState({
    status: "" as ProductStatus | "",
    category: "",
    lowStock: false,
    outOfStock: false,
  });
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        sortBy,
        sortOrder,
      });

      if (debouncedSearch) {
        params.append("search", debouncedSearch);
      }
      if (filters.status) {
        params.append("status", filters.status);
      }
      if (filters.category) {
        params.append("category", filters.category);
      }
      if (filters.lowStock) {
        params.append("lowStock", "true");
      }
      if (filters.outOfStock) {
        params.append("outOfStock", "true");
      }

      const res = await fetch(`/api/products?${params.toString()}`);
      const data: ProductsResponse = await res.json();

      if (data.success) {
        setProducts(data.data);
        setPagination(data.pagination);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filters, sortBy, sortOrder]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const clearFilters = () => {
    setFilters({ status: "", category: "", lowStock: false, outOfStock: false });
    setSearch("");
    setPage(1);
  };

  const getStatusColor = (status: ProductStatus) => {
    const colors: Record<ProductStatus, string> = {
      ACTIVE: "bg-green-100 text-green-700",
      INACTIVE: "bg-gray-100 text-gray-700",
      DISCONTINUED: "bg-red-100 text-red-700",
      OUT_OF_STOCK: "bg-orange-100 text-orange-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const getStockStatus = (currentStock: number, lowStockAlert: number) => {
    if (currentStock === 0) {
      return {
        label: "Out of Stock",
        color: "text-red-600 bg-red-50",
        icon: XCircle,
      };
    }
    if (currentStock <= lowStockAlert) {
      return {
        label: "Low Stock",
        color: "text-orange-600 bg-orange-50",
        icon: AlertTriangle,
      };
    }
    return {
      label: "In Stock",
      color: "text-green-600 bg-green-50",
      icon: CheckCircle2,
    };
  };

  const calculateProfitMargin = (sellingPrice: number, costPrice: number) => {
    if (costPrice === 0) return 0;
    return ((sellingPrice - costPrice) / costPrice) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">
            Manage your product inventory and pricing
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Link href="/dashboard/admin/products/add">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Products
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.totalProducts.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.activeCount} active
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Inventory Value
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "SLL",
                    minimumFractionDigits: 0,
                  }).format(stats.totalInventoryValue)}
                </p>
                <p className="text-xs text-gray-500 mt-1">At cost price</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Low Stock Items
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.lowStockCount}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.outOfStockCount} out of stock
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Avg. Selling Price
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "SLL",
                    minimumFractionDigits: 0,
                  }).format(stats.averageSellingPrice)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Avg. margin:{" "}
                  {calculateProfitMargin(
                    stats.averageSellingPrice,
                    stats.averageCostPrice
                  ).toFixed(1)}
                  %
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search by name, SKU, barcode, or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 text-gray-900"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {(filters.status ||
                filters.category ||
                filters.lowStock ||
                filters.outOfStock) && (
                <span className="ml-2 bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {[
                    filters.status,
                    filters.category,
                    filters.lowStock,
                    filters.outOfStock,
                  ].filter(Boolean).length}
                </span>
              )}
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      status: e.target.value as ProductStatus | "",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="DISCONTINUED">Discontinued</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Category
                </label>
                <Input
                  type="text"
                  placeholder="Filter by category..."
                  value={filters.category}
                  onChange={(e) =>
                    setFilters({ ...filters, category: e.target.value })
                  }
                  className="text-gray-900"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.lowStock}
                    onChange={(e) =>
                      setFilters({ ...filters, lowStock: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Low Stock</span>
                </label>
              </div>
              <div className="flex items-end">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.outOfStock}
                    onChange={(e) =>
                      setFilters({ ...filters, outOfStock: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Out of Stock</span>
                </label>
              </div>
              {(filters.status ||
                filters.category ||
                filters.lowStock ||
                filters.outOfStock) && (
                <div className="md:col-span-4 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">
            All Products ({pagination.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No products found</p>
              <p className="text-gray-500 text-sm mt-2">
                {debouncedSearch ||
                filters.status ||
                filters.category ||
                filters.lowStock ||
                filters.outOfStock
                  ? "Try adjusting your search or filters"
                  : "Get started by adding your first product"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        <button
                          onClick={() => handleSort("name")}
                          className="flex items-center gap-2 hover:text-gray-900"
                        >
                          Product
                          <ArrowUpDown className="w-4 h-4" />
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        SKU / Barcode
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Category
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        <button
                          onClick={() => handleSort("currentStock")}
                          className="flex items-center gap-2 hover:text-gray-900"
                        >
                          Stock
                          <ArrowUpDown className="w-4 h-4" />
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        <button
                          onClick={() => handleSort("sellingPrice")}
                          className="flex items-center gap-2 hover:text-gray-900"
                        >
                          Price
                          <ArrowUpDown className="w-4 h-4" />
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Margin
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => {
                      const stockStatus = getStockStatus(
                        product.currentStock,
                        product.lowStockAlert
                      );
                      const StockIcon = stockStatus.icon;
                      const margin = calculateProfitMargin(
                        product.sellingPrice,
                        product.costPrice
                      );

                      return (
                        <tr
                          key={product.id}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-medium text-gray-900">
                                {product.name}
                              </p>
                              {product.description && (
                                <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                  {product.description}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              <p className="text-sm text-gray-700 font-mono">
                                {product.sku}
                              </p>
                              {product.barcode && (
                                <p className="text-xs text-gray-500 font-mono">
                                  {product.barcode}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            {product.category ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                {product.category}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">—</span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.color}`}
                              >
                                <StockIcon className="w-3 h-3 mr-1" />
                                {product.currentStock} {product.unit}
                              </span>
                              {product.currentStock <= product.lowStockAlert &&
                                product.currentStock > 0 && (
                                  <span className="text-xs text-orange-600">
                                    Alert: {product.lowStockAlert}
                                  </span>
                                )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-medium text-gray-900">
                                {new Intl.NumberFormat("en-US", {
                                  style: "currency",
                                  currency: "SLL",
                                  minimumFractionDigits: 0,
                                }).format(product.sellingPrice)}
                              </p>
                              <p className="text-xs text-gray-500">
                                Cost:{" "}
                                {new Intl.NumberFormat("en-US", {
                                  style: "currency",
                                  currency: "SLL",
                                  minimumFractionDigits: 0,
                                }).format(product.costPrice)}
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`text-sm font-medium ${
                                margin >= 30
                                  ? "text-green-600"
                                  : margin >= 15
                                  ? "text-blue-600"
                                  : "text-gray-600"
                              }`}
                            >
                              {margin.toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                product.status
                              )}`}
                            >
                              {product.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Showing {(page - 1) * pagination.limit + 1} to{" "}
                    {Math.min(page * pagination.limit, pagination.total)} of{" "}
                    {pagination.total} products
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: pagination.totalPages },
                        (_, i) => i + 1
                      )
                        .filter(
                          (p) =>
                            p === 1 ||
                            p === pagination.totalPages ||
                            (p >= page - 1 && p <= page + 1)
                        )
                        .map((p, idx, arr) => (
                          <div key={p} className="flex items-center gap-1">
                            {idx > 0 && arr[idx - 1] !== p - 1 && (
                              <span className="px-2 text-gray-400">...</span>
                            )}
                            <Button
                              variant={p === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPage(p)}
                              className="min-w-[40px]"
                            >
                              {p}
                            </Button>
                          </div>
                        ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === pagination.totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

