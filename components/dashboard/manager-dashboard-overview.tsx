"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SalesTrendChart } from "@/components/analytics/SalesTrendChart";
import { CustomerSegmentChart } from "@/components/analytics/CustomerSegmentChart";
import { RevenueForecastChart } from "@/components/analytics/RevenueForecastChart";
import { ChurnRiskIndicator } from "@/components/analytics/ChurnRiskIndicator";
import { KeyInsightsView } from "@/components/insights/key-insights-view";
import { TrendingUp, Users, DollarSign, AlertTriangle, Package, ShoppingCart, BarChart3, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRoutes } from "@/lib/hooks/use-routes";

interface DashboardStats {
  totalRevenue: number;
  totalCustomers: number;
  totalSales: number;
  churnRiskCustomers: number;
  totalProducts: number;
  lowStockItems: number;
}

export function ManagerDashboardOverview() {
  const routes = useRoutes();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [salesTrends, setSalesTrends] = useState<any[]>([]);
  const [segments, setSegments] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any[]>([]);
  const [historicalRevenue, setHistoricalRevenue] = useState<any[]>([]);
  const [churnCustomers, setChurnCustomers] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [salesStats, setSalesStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch all dashboard data in parallel
        const [trendsRes, segmentsRes, forecastRes, churnRes, productsRes, topCustomersRes, salesRes] = await Promise.all([
          fetch("/api/analytics/sales/trends?months=6"),
          fetch("/api/analytics/customers/segments"),
          fetch("/api/analytics/sales/forecast?monthsAhead=6&combined=true"),
          fetch("/api/analytics/customers/churn-risk?minRiskLevel=MEDIUM"),
          fetch("/api/products?limit=1"),
          fetch("/api/analytics/customers/insights?limit=5"),
          fetch("/api/sales?limit=1"),
        ]);

        const trendsData = await trendsRes.json();
        const segmentsData = await segmentsRes.json();
        const forecastData = await forecastRes.json();
        const churnData = await churnRes.json();
        const productsData = await productsRes.json();
        const topCustomersData = await topCustomersRes.json();
        const salesData = await salesRes.json();

        if (trendsData.success) setSalesTrends(trendsData.data);
        if (segmentsData.success) setSegments(segmentsData.data);
        if (forecastData.success) {
          const fd = forecastData.data;
          if (fd?.historical && fd?.forecast) {
            setHistoricalRevenue(fd.historical);
            setForecast(fd.forecast);
          } else {
            setHistoricalRevenue([]);
            setForecast(Array.isArray(fd) ? fd : []);
          }
        }
        if (churnData.success) setChurnCustomers(churnData.data);
        if (topCustomersData.success) setTopCustomers(topCustomersData.data);
        if (salesData.success) setSalesStats(salesData.stats);

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
      {/* Customer Insights Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Customer Analytics & Insights</h2>
        <p className="text-sm text-gray-600">Monitor customer behavior, sales trends, and business performance</p>
      </div>

      {/* Key Insights - Colored alert cards & Customer Analysis Summary */}
      <KeyInsightsView />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href={routes.salesAdd}>
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
        <Link href={routes.customersAdd}>
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
        <Link href={routes.productsAdd}>
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

      {/* Full Width Charts */}
      {salesTrends.length > 0 && (
        <div className="w-full">
          <SalesTrendChart data={salesTrends} />
        </div>
      )}

      {forecast.length > 0 && (
        <div className="w-full">
          <RevenueForecastChart
            data={forecast}
            historical={historicalRevenue}
            showInfoBanner
          />
        </div>
      )}

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {segments.length > 0 && <CustomerSegmentChart data={segments} />}
        {topChurnCustomer && (
          <ChurnRiskIndicator
            riskLevel={topChurnCustomer.analysis.riskLevel}
            riskScore={topChurnCustomer.analysis.riskScore}
            factors={topChurnCustomer.analysis.factors}
            recommendations={topChurnCustomer.analysis.recommendations}
          />
        )}
      </div>

      {/* Top Customers & Additional Stats */}
      {topCustomers.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Top Customers
              </CardTitle>
              <Link href={routes.customerInsights}>
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCustomers.slice(0, 5).map((customer: any, index: number) => (
                <div
                  key={customer.customerId}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{customer.customerName}</p>
                      <p className="text-sm text-gray-600">
                        {customer.totalVisits} visits • Avg: {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "SLL",
                          minimumFractionDigits: 0,
                        }).format(customer.averageOrderValue)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "SLL",
                        minimumFractionDigits: 0,
                      }).format(customer.totalSpent)}
                    </p>
                    <p className="text-xs text-gray-500">Loyalty: {customer.loyaltyScore}/100</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revenue Breakdown */}
      {salesStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Today's Revenue</CardTitle>
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "SLL",
                  minimumFractionDigits: 0,
                }).format(salesStats.todayRevenue || 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">{salesStats.todaySales || 0} sales today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">This Week</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "SLL",
                  minimumFractionDigits: 0,
                }).format(salesStats.weekRevenue || 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">This Month</CardTitle>
              <DollarSign className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "SLL",
                  minimumFractionDigits: 0,
                }).format(salesStats.monthRevenue || 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

