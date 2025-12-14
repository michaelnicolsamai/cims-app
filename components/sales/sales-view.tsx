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
  Receipt,
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  X,
  Calendar,
  User,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { PaymentMethod, PaymentStatus, SaleStatus } from "@prisma/client";

interface SaleItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Sale {
  id: string;
  invoiceNumber: string;
  customer?: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
  } | null;
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: SaleStatus;
  saleDate: string;
  dueDate?: string | null;
  notes?: string | null;
  saleRegion?: {
    id: string;
    name: string;
  } | null;
  soldBy?: {
    id: string;
    name: string;
  } | null;
  items: SaleItem[];
  _count: {
    items: number;
  };
}

interface SalesResponse {
  success: boolean;
  data: Sale[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    totalRevenue: number;
    todayRevenue: number;
    weekRevenue: number;
    monthRevenue: number;
    totalSales: number;
    todaySales: number;
    pendingPayments: number;
    overduePayments: number;
  };
}

export function SalesView() {
  const [sales, setSales] = useState<Sale[]>([]);
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
    totalRevenue: 0,
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    totalSales: 0,
    todaySales: 0,
    pendingPayments: 0,
    overduePayments: 0,
  });
  const [filters, setFilters] = useState({
    status: "" as SaleStatus | "",
    paymentStatus: "" as PaymentStatus | "",
    paymentMethod: "" as PaymentMethod | "",
    dateRange: "all" as "all" | "today" | "week" | "month" | "custom",
    startDate: "",
    endDate: "",
  });
  const [sortBy, setSortBy] = useState("saleDate");
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

  // Fetch sales
  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        sortBy,
        sortOrder,
        dateRange: filters.dateRange,
      });

      if (debouncedSearch) {
        params.append("search", debouncedSearch);
      }
      if (filters.status) {
        params.append("status", filters.status);
      }
      if (filters.paymentStatus) {
        params.append("paymentStatus", filters.paymentStatus);
      }
      if (filters.paymentMethod) {
        params.append("paymentMethod", filters.paymentMethod);
      }
      if (filters.dateRange === "custom" && filters.startDate) {
        params.append("startDate", filters.startDate);
      }
      if (filters.dateRange === "custom" && filters.endDate) {
        params.append("endDate", filters.endDate);
      }

      const res = await fetch(`/api/sales?${params.toString()}`);
      const data: SalesResponse = await res.json();

      if (data.success) {
        setSales(data.data);
        setPagination(data.pagination);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching sales:", error);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filters, sortBy, sortOrder]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      paymentStatus: "",
      paymentMethod: "",
      dateRange: "all",
      startDate: "",
      endDate: "",
    });
    setSearch("");
    setPage(1);
  };

  const getStatusColor = (status: SaleStatus) => {
    const colors: Record<SaleStatus, string> = {
      COMPLETED: "bg-green-100 text-green-700",
      PENDING: "bg-yellow-100 text-yellow-700",
      CANCELLED: "bg-red-100 text-red-700",
      RETURNED: "bg-orange-100 text-orange-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const getPaymentStatusColor = (status: PaymentStatus) => {
    const colors: Record<PaymentStatus, string> = {
      PAID: "bg-green-100 text-green-700",
      PARTIAL: "bg-yellow-100 text-yellow-700",
      PENDING: "bg-orange-100 text-orange-700",
      OVERDUE: "bg-red-100 text-red-700",
      REFUNDED: "bg-gray-100 text-gray-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    if (method === "CASH") return "💵";
    if (method === "MOBILE_MONEY") return "📱";
    if (method === "BANK_TRANSFER") return "🏦";
    if (method === "POS") return "💳";
    if (method === "CREDIT") return "📝";
    if (method === "CHEQUE") return "📄";
    return "💰";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales</h1>
          <p className="text-gray-600 mt-1">
            View and manage all your sales transactions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Link href="/dashboard/admin/sales/add">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Sale
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
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "SLL",
                    minimumFractionDigits: 0,
                  }).format(stats.totalRevenue)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.totalSales} total sales
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Today's Revenue
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "SLL",
                    minimumFractionDigits: 0,
                  }).format(stats.todayRevenue)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.todaySales} sales today
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Pending Payments
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "SLL",
                    minimumFractionDigits: 0,
                  }).format(stats.pendingPayments)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Awaiting payment</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Overdue Payments
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "SLL",
                    minimumFractionDigits: 0,
                  }).format(stats.overduePayments)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Requires attention</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
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
                placeholder="Search by invoice number, customer name, phone, or notes..."
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
                filters.paymentStatus ||
                filters.paymentMethod ||
                filters.dateRange !== "all") && (
                <span className="ml-2 bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {[
                    filters.status,
                    filters.paymentStatus,
                    filters.paymentMethod,
                    filters.dateRange !== "all" ? 1 : 0,
                  ].filter(Boolean).length}
                </span>
              )}
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Sale Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      status: e.target.value as SaleStatus | "",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING">Pending</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="RETURNED">Returned</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Payment Status
                </label>
                <select
                  value={filters.paymentStatus}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      paymentStatus: e.target.value as PaymentStatus | "",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Payment Statuses</option>
                  <option value="PAID">Paid</option>
                  <option value="PARTIAL">Partial</option>
                  <option value="PENDING">Pending</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Payment Method
                </label>
                <select
                  value={filters.paymentMethod}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      paymentMethod: e.target.value as PaymentMethod | "",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Methods</option>
                  <option value="CASH">Cash</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="POS">POS</option>
                  <option value="CREDIT">Credit</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Date Range
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      dateRange: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
              {filters.dateRange === "custom" && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Start Date
                    </label>
                    <Input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) =>
                        setFilters({ ...filters, startDate: e.target.value })
                      }
                      className="text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      End Date
                    </label>
                    <Input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) =>
                        setFilters({ ...filters, endDate: e.target.value })
                      }
                      className="text-gray-900"
                    />
                  </div>
                </>
              )}
              {(filters.status ||
                filters.paymentStatus ||
                filters.paymentMethod ||
                filters.dateRange !== "all") && (
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

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">
            All Sales ({pagination.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : sales.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No sales found</p>
              <p className="text-gray-500 text-sm mt-2">
                {debouncedSearch ||
                filters.status ||
                filters.paymentStatus ||
                filters.paymentMethod ||
                filters.dateRange !== "all"
                  ? "Try adjusting your search or filters"
                  : "Get started by creating your first sale"}
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
                          onClick={() => handleSort("invoiceNumber")}
                          className="flex items-center gap-2 hover:text-gray-900"
                        >
                          Invoice
                          <ArrowUpDown className="w-4 h-4" />
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Customer
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        <button
                          onClick={() => handleSort("saleDate")}
                          className="flex items-center gap-2 hover:text-gray-900"
                        >
                          Date
                          <ArrowUpDown className="w-4 h-4" />
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Items
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        <button
                          onClick={() => handleSort("totalAmount")}
                          className="flex items-center gap-2 hover:text-gray-900"
                        >
                          Amount
                          <ArrowUpDown className="w-4 h-4" />
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Payment
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
                    {sales.map((sale) => (
                      <tr
                        key={sale.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-gray-900 font-mono">
                              {sale.invoiceNumber}
                            </p>
                            {sale.saleRegion && (
                              <p className="text-xs text-gray-500 mt-1">
                                {sale.saleRegion.name}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {sale.customer ? (
                            <div>
                              <Link
                                href={`/dashboard/admin/customers/${sale.customer.id}/insights`}
                                className="font-medium text-gray-900 hover:text-blue-600"
                              >
                                {sale.customer.name}
                              </Link>
                              {sale.customer.phone && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {sale.customer.phone}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">
                              Walk-in Customer
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-sm text-gray-900">
                              {format(new Date(sale.saleDate), "MMM dd, yyyy")}
                            </p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(sale.saleDate), "hh:mm a")}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-700">
                            {sale._count.items} item{sale._count.items !== 1 ? "s" : ""}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "SLL",
                                minimumFractionDigits: 0,
                              }).format(sale.totalAmount)}
                            </p>
                            {sale.balanceDue > 0 && (
                              <p className="text-xs text-orange-600 mt-1">
                                Due:{" "}
                                {new Intl.NumberFormat("en-US", {
                                  style: "currency",
                                  currency: "SLL",
                                  minimumFractionDigits: 0,
                                }).format(sale.balanceDue)}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(
                                sale.paymentStatus
                              )}`}
                            >
                              {sale.paymentStatus}
                            </span>
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <span>{getPaymentMethodIcon(sale.paymentMethod)}</span>
                              <span>
                                {sale.paymentMethod.replace("_", " ")}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              sale.status
                            )}`}
                          >
                            {sale.status}
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
                    {pagination.total} sales
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

