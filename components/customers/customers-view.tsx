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
  Users,
  DollarSign,
  TrendingUp,
  Star,
  Phone,
  Mail,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  X,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { CustomerType } from "@prisma/client";

interface Customer {
  id: string;
  customerCode: string;
  name: string;
  phone: string;
  alternatePhone?: string | null;
  email?: string | null;
  address?: string | null;
  city: string;
  type: CustomerType;
  tags: string[];
  totalSpent: number;
  totalVisits: number;
  loyaltyScore: number;
  lastVisit?: string | null;
  firstVisit?: string | null;
  createdAt: string;
  region?: {
    id: string;
    name: string;
  } | null;
  district?: {
    id: string;
    name: string;
  } | null;
  country?: {
    id: string;
    name: string;
  } | null;
  _count: {
    sales: number;
    customerInteractions: number;
  };
}

interface CustomersResponse {
  success: boolean;
  data: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    totalCustomers: number;
    totalRevenue: number;
    averageLoyaltyScore: number;
    averageSpent: number;
  };
}

export function CustomersView() {
  const [customers, setCustomers] = useState<Customer[]>([]);
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
    totalCustomers: 0,
    totalRevenue: 0,
    averageLoyaltyScore: 0,
    averageSpent: 0,
  });
  const [filters, setFilters] = useState({
    type: "" as CustomerType | "",
    tag: "",
    city: "",
  });
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
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
      if (filters.type) {
        params.append("type", filters.type);
      }
      if (filters.tag) {
        params.append("tag", filters.tag);
      }
      if (filters.city) {
        params.append("city", filters.city);
      }

      const res = await fetch(`/api/customers?${params.toString()}`);
      const data: CustomersResponse = await res.json();

      if (data.success) {
        setCustomers(data.data);
        setPagination(data.pagination);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filters, sortBy, sortOrder]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const clearFilters = () => {
    setFilters({ type: "", tag: "", city: "" });
    setSearch("");
    setPage(1);
  };

  const getLoyaltyColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50";
    if (score >= 60) return "text-blue-600 bg-blue-50";
    if (score >= 40) return "text-yellow-600 bg-yellow-50";
    return "text-gray-600 bg-gray-50";
  };

  const getTypeColor = (type: CustomerType) => {
    const colors: Record<CustomerType, string> = {
      RETAIL: "bg-blue-100 text-blue-700",
      WHOLESALE: "bg-purple-100 text-purple-700",
      CORPORATE: "bg-indigo-100 text-indigo-700",
      REGULAR: "bg-green-100 text-green-700",
      WALK_IN: "bg-gray-100 text-gray-700",
    };
    return colors[type] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">
            Manage and view all your customers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Link href="/dashboard/admin/customers/add">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
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
                  Total Customers
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.totalCustomers.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "SLL",
                    minimumFractionDigits: 0,
                  }).format(Number(stats.totalRevenue))}
                </p>
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
                  Avg. Loyalty Score
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {Math.round(stats.averageLoyaltyScore)}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Avg. Customer Value
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "SLL",
                    minimumFractionDigits: 0,
                  }).format(Number(stats.averageSpent))}
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
                placeholder="Search by name, phone, email, or code..."
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
              {(filters.type || filters.tag || filters.city) && (
                <span className="ml-2 bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {[filters.type, filters.tag, filters.city].filter(Boolean)
                    .length}
                </span>
              )}
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Customer Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) =>
                    setFilters({ ...filters, type: e.target.value as CustomerType | "" })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="RETAIL">Retail</option>
                  <option value="WHOLESALE">Wholesale</option>
                  <option value="CORPORATE">Corporate</option>
                  <option value="REGULAR">Regular</option>
                  <option value="WALK_IN">Walk-in</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Tag
                </label>
                <Input
                  type="text"
                  placeholder="Filter by tag..."
                  value={filters.tag}
                  onChange={(e) =>
                    setFilters({ ...filters, tag: e.target.value })
                  }
                  className="text-gray-900"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  City
                </label>
                <Input
                  type="text"
                  placeholder="Filter by city..."
                  value={filters.city}
                  onChange={(e) =>
                    setFilters({ ...filters, city: e.target.value })
                  }
                  className="text-gray-900"
                />
              </div>
              {(filters.type || filters.tag || filters.city) && (
                <div className="md:col-span-3 flex justify-end">
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

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">
            All Customers ({pagination.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No customers found</p>
              <p className="text-gray-500 text-sm mt-2">
                {debouncedSearch || filters.type || filters.tag || filters.city
                  ? "Try adjusting your search or filters"
                  : "Get started by adding your first customer"}
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
                          Customer
                          <ArrowUpDown className="w-4 h-4" />
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Contact
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Location
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        <button
                          onClick={() => handleSort("totalSpent")}
                          className="flex items-center gap-2 hover:text-gray-900"
                        >
                          Total Spent
                          <ArrowUpDown className="w-4 h-4" />
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        <button
                          onClick={() => handleSort("loyaltyScore")}
                          className="flex items-center gap-2 hover:text-gray-900"
                        >
                          Loyalty
                          <ArrowUpDown className="w-4 h-4" />
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Type
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr
                        key={customer.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div>
                            <Link
                              href={`/dashboard/admin/customers/${customer.id}/insights`}
                              className="font-medium text-gray-900 hover:text-blue-600"
                            >
                              {customer.name}
                            </Link>
                            <p className="text-xs text-gray-500 mt-1">
                              {customer.customerCode}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <Phone className="w-3 h-3 text-gray-400" />
                              {customer.phone}
                            </div>
                            {customer.email && (
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <Mail className="w-3 h-3 text-gray-400" />
                                <span className="truncate max-w-[200px]">
                                  {customer.email}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <span>
                              {customer.city}
                              {customer.region && `, ${customer.region.name}`}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "SLL",
                                minimumFractionDigits: 0,
                              }).format(Number(customer.totalSpent))}
                            </p>
                            <p className="text-xs text-gray-500">
                              {customer.totalVisits} visits
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLoyaltyColor(
                              customer.loyaltyScore
                            )}`}
                          >
                            <Star className="w-3 h-3 mr-1" />
                            {customer.loyaltyScore}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                              customer.type
                            )}`}
                          >
                            {customer.type.replace("_", " ")}
                          </span>
                          {customer.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {customer.tags.slice(0, 2).map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                                >
                                  {tag}
                                </span>
                              ))}
                              {customer.tags.length > 2 && (
                                <span className="text-xs text-gray-500">
                                  +{customer.tags.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/dashboard/admin/customers/${customer.id}/insights`}
                            >
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Showing {(page - 1) * pagination.limit + 1} to{" "}
                    {Math.min(page * pagination.limit, pagination.total)} of{" "}
                    {pagination.total} customers
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
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
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

