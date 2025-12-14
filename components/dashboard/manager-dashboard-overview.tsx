"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SalesTrendChart } from "@/components/analytics/SalesTrendChart";
import { CustomerSegmentChart } from "@/components/analytics/CustomerSegmentChart";
import { RevenueForecastChart } from "@/components/analytics/RevenueForecastChart";
import { ChurnRiskIndicator } from "@/components/analytics/ChurnRiskIndicator";
import { TrendingUp, Users, DollarSign, AlertTriangle, Package, ShoppingCart, BarChart3 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface DashboardStats {
  totalRevenue: number;
  totalCustomers: number;
  totalSales: number;
  churnRiskCustomers: number;
  totalProducts: number;
  lowStockItems: number;
}

export function ManagerDashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [salesTrends, setSalesTrends] = useState<any[]>([]);
  const [segments, setSegments] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any[]>([]);
  const [churnCustomers, setChurnCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch all dashboard data in parallel
        const [trendsRes, segmentsRes, forecastRes, churnRes, productsRes] = await Promise.all([
          fetch("/api/analytics/sales/trends?months=6"),
          fetch("/api/analytics/customers/segments"),
          fetch("/api/analytics/sales/forecast?monthsAhead=6"),
          fetch("/api/analytics/customers/churn-risk?minRiskLevel=MEDIUM"),
          fetch("/api/products?limit=1"),
        ]);

        const trendsData = await trendsRes.json();
        const segmentsData = await segmentsRes.json();
        const forecastData = await forecastRes.json();
        const churnData = await churnRes.json();
        const productsData = await productsRes.json();

        if (trendsData.success) setSalesTrends(trendsData.data);
        if (segmentsData.success) setSegments(segmentsData.data);
        if (forecastData.success) setForecast(forecastData.data);
        if (churnData.success) setChurnCustomers(churnData.data);

        // Calculate stats
        const totalRevenue = trendsData.data?.reduce(
          (sum: number, t: any) => sum + t.totalRevenue,
          0
        ) || 0;
        const totalSales = trendsData.data?.reduce(
          (sum: number, t: any) => sum + t.numberOfOrders,
          0
        ) || 0;
        const totalCustomers = segmentsData.data?.reduce(
          (sum: number, s: any) => sum + s.count,
          0
        ) || 0;
        const totalProducts = productsData.stats?.totalProducts || 0;
        const lowStockItems = productsData.stats?.lowStockCount || 0;

        setStats({
          totalRevenue,
          totalCustomers,
          totalSales,
          churnRiskCustomers: churnData.data?.length || 0,
          totalProducts,
          lowStockItems,
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

  const topChurnCustomer = churnCustomers[0];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/admin/sales/add">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-blue-200 hover:border-blue-400">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">New Sale</p>
                  <p className="text-xs text-gray-500 mt-1">Create a new sale transaction</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/admin/customers/add">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-green-200 hover:border-green-400">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Add Customer</p>
                  <p className="text-xs text-gray-500 mt-1">Register a new customer</p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/admin/products/add">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-purple-200 hover:border-purple-400">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Add Product</p>
                  <p className="text-xs text-gray-500 mt-1">Add new product to inventory</p>
                </div>
                <Package className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              Le {stats?.totalRevenue.toLocaleString() || "0"}
            </div>
            <p className="text-xs text-gray-500 mt-1">Last 6 months</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Customers</CardTitle>
            <Users className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats?.totalCustomers || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Active customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Sales</CardTitle>
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats?.totalSales || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Orders completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">At-Risk Customers</CardTitle>
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats?.churnRiskCustomers || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Products</CardTitle>
            <Package className="h-5 w-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats?.totalProducts || 0}</div>
            <p className="text-xs text-gray-500 mt-1">In inventory</p>
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {salesTrends.length > 0 && <SalesTrendChart data={salesTrends} />}
        {segments.length > 0 && <CustomerSegmentChart data={segments} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {forecast.length > 0 && <RevenueForecastChart data={forecast} />}
        {topChurnCustomer && (
          <ChurnRiskIndicator
            riskLevel={topChurnCustomer.analysis.riskLevel}
            riskScore={topChurnCustomer.analysis.riskScore}
            factors={topChurnCustomer.analysis.factors}
            recommendations={topChurnCustomer.analysis.recommendations}
          />
        )}
      </div>
    </div>
  );
}

