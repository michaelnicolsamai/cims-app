"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, DollarSign, Package, ShoppingCart, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface DashboardStats {
  todayRevenue: number;
  todaySales: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockItems: number;
  pendingPayments: number;
}

export function StaffDashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        // Fetch data for staff dashboard
        const [salesRes, customersRes, productsRes] = await Promise.all([
          fetch(`/api/sales?startDate=${startOfDay.toISOString()}&endDate=${endOfDay.toISOString()}&limit=5`),
          fetch("/api/customers?limit=1"),
          fetch("/api/products?limit=1"),
        ]);

        const salesData = await salesRes.json();
        const customersData = await customersRes.json();
        const productsData = await productsRes.json();

        // Calculate today's stats
        const todaySales = salesData.data || [];
        const todayRevenue = todaySales.reduce(
          (sum: number, sale: any) => sum + Number(sale.totalAmount),
          0
        );

        // Calculate pending payments
        const pendingPayments = todaySales.filter(
          (sale: any) => sale.paymentStatus === "PENDING" || sale.paymentStatus === "PARTIAL"
        ).length;

        setRecentSales(todaySales.slice(0, 5));

        setStats({
          todayRevenue,
          todaySales: todaySales.length,
          totalCustomers: customersData.stats?.totalCustomers || 0,
          totalProducts: productsData.stats?.totalProducts || 0,
          lowStockItems: productsData.stats?.lowStockCount || 0,
          pendingPayments,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/admin/sales/add">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-blue-200 hover:border-blue-400 bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">New Sale</p>
                  <p className="text-xs text-gray-500 mt-1">Process a new transaction</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <ShoppingCart className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/admin/customers/add">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-green-200 hover:border-green-400 bg-gradient-to-br from-green-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Add Customer</p>
                  <p className="text-xs text-gray-500 mt-1">Register new customer</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/admin/products/add">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-purple-200 hover:border-purple-400 bg-gradient-to-br from-purple-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Add Product</p>
                  <p className="text-xs text-gray-500 mt-1">Add to inventory</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Package className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Today's Stats */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Today's Performance</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Today's Revenue</CardTitle>
              <DollarSign className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                Le {stats?.todayRevenue.toLocaleString() || "0"}
              </div>
              <p className="text-xs text-gray-500 mt-1">Total sales today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Today's Sales</CardTitle>
              <ShoppingCart className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats?.todaySales || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Transactions today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Pending Payments</CardTitle>
              <Clock className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats?.pendingPayments || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Awaiting payment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Low Stock Items</CardTitle>
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats?.lowStockItems || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Need restocking</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Customers</CardTitle>
            <Users className="h-5 w-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats?.totalCustomers || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Registered customers</p>
            <Link href="/dashboard/admin/customers">
              <Button variant="outline" size="sm" className="mt-3">
                View All Customers
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Products</CardTitle>
            <Package className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats?.totalProducts || 0}</div>
            <p className="text-xs text-gray-500 mt-1">In inventory</p>
            <Link href="/dashboard/admin/products">
              <Button variant="outline" size="sm" className="mt-3">
                View All Products
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales */}
      {recentSales.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Recent Sales Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <ShoppingCart className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{sale.invoiceNumber}</p>
                      <p className="text-sm text-gray-500">
                        {sale.customer?.name || "Walk-in Customer"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      Le {Number(sale.totalAmount).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(sale.saleDate).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/dashboard/admin/sales">
              <Button variant="outline" className="w-full mt-4">
                View All Sales
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

