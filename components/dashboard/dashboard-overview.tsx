"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SalesTrendChart } from "@/components/analytics/SalesTrendChart";
import { CustomerSegmentChart } from "@/components/analytics/CustomerSegmentChart";
import { RevenueForecastChart } from "@/components/analytics/RevenueForecastChart";
import { ChurnRiskIndicator } from "@/components/analytics/ChurnRiskIndicator";
import { TrendingUp, Users, DollarSign, AlertTriangle } from "lucide-react";

interface DashboardStats {
  totalRevenue: number;
  totalCustomers: number;
  totalSales: number;
  churnRiskCustomers: number;
}

export function DashboardOverview() {
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
        const [trendsRes, segmentsRes, forecastRes, churnRes] = await Promise.all([
          fetch("/api/analytics/sales/trends?months=6"),
          fetch("/api/analytics/customers/segments"),
          fetch("/api/analytics/sales/forecast?monthsAhead=6"),
          fetch("/api/analytics/customers/churn-risk?minRiskLevel=MEDIUM"),
        ]);

        const trendsData = await trendsRes.json();
        const segmentsData = await segmentsRes.json();
        const forecastData = await forecastRes.json();
        const churnData = await churnRes.json();

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

        setStats({
          totalRevenue,
          totalCustomers,
          totalSales,
          churnRiskCustomers: churnData.data?.length || 0,
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

