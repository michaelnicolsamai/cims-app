"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SalesTrendChart } from "@/components/analytics/SalesTrendChart";
import { RevenueForecastChart } from "@/components/analytics/RevenueForecastChart";
import { CustomerInsightChart } from "@/components/analytics/CustomerInsightChart";
import { DollarSign, TrendingUp, ShoppingCart, BarChart3, Filter, Calendar, CreditCard, Package, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PaymentMethodAnalysis {
  method: string;
  count: number;
  totalAmount: number;
  percentage: number;
}

interface BestSellingProduct {
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

export function ManagerSalesAnalyticsContent() {
  const [salesTrends, setSalesTrends] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any[]>([]);
  const [historicalRevenue, setHistoricalRevenue] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodAnalysis[]>([]);
  const [bestSellers, setBestSellers] = useState<BestSellingProduct[]>([]);
  const [salesStats, setSalesStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [monthsRange, setMonthsRange] = useState(12);
  const [forecastMonths, setForecastMonths] = useState(6);
  const [bestSellersLimit, setBestSellersLimit] = useState(10);

  useEffect(() => {
    async function fetchSalesData() {
      try {
        setLoading(true);
        const [trendsRes, forecastRes, paymentRes, productsRes, salesRes] = await Promise.all([
          fetch(`/api/analytics/sales/trends?months=${monthsRange}`),
          fetch(`/api/analytics/sales/forecast?monthsAhead=${forecastMonths}&combined=true`),
          fetch("/api/analytics/sales/payment-methods"),
          fetch(`/api/analytics/sales/best-products?limit=${bestSellersLimit}`),
          fetch("/api/sales?limit=1"),
        ]);

        const trendsData = await trendsRes.json();
        const forecastData = await forecastRes.json();
        const paymentData = await paymentRes.json();
        const productsData = await productsRes.json();
        const salesData = await salesRes.json();

        if (trendsData.success) setSalesTrends(trendsData.data);
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
        if (paymentData.success) setPaymentMethods(paymentData.data);
        if (productsData.success) setBestSellers(productsData.data);
        if (salesData.success) setSalesStats(salesData.stats);
      } catch (error) {
        console.error("Error fetching sales data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSalesData();
  }, [monthsRange, forecastMonths, bestSellersLimit]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sales analytics...</p>
        </div>
      </div>
    );
  }

  const paymentChartData = paymentMethods.map((pm) => ({
    name: pm.method.replace("_", " "),
    value: pm.totalAmount,
  }));

  const productsChartData = bestSellers.map((p) => ({
    name: p.productName,
    value: p.totalQuantity,
  }));

  // Calculate summary stats
  const totalRevenue = salesTrends.length > 0 
    ? salesTrends.reduce((sum, t) => sum + (t.totalRevenue || 0), 0)
    : 0;
  const totalOrders = salesTrends.length > 0
    ? salesTrends.reduce((sum, t) => sum + (t.numberOfOrders || 0), 0)
    : 0;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const lastMonthRevenue = salesTrends.length > 0 ? (salesTrends[salesTrends.length - 1]?.totalRevenue || 0) : 0;
  const previousMonthRevenue = salesTrends.length > 1 ? (salesTrends[salesTrends.length - 2]?.totalRevenue || 0) : 0;
  const revenueGrowth = previousMonthRevenue > 0 
    ? ((lastMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Sales Analytics
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Comprehensive sales analysis, trends, forecasts, and performance metrics
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "SLL",
                    minimumFractionDigits: 0,
                  }).format(totalRevenue)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Last {monthsRange} months</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalOrders}</p>
                <p className="text-xs text-gray-500 mt-1">Completed sales</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "SLL",
                    minimumFractionDigits: 0,
                  }).format(avgOrderValue)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Per transaction</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenue Growth</p>
                <p className={`text-2xl font-bold mt-1 ${revenueGrowth >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {revenueGrowth >= 0 ? "+" : ""}{revenueGrowth.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Month-over-month</p>
              </div>
              <ArrowUpDown className="w-8 h-8 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      {salesStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Today's Revenue</CardTitle>
              <Calendar className="h-5 w-5 text-blue-600" />
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

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-900">Analytics Settings</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? "Hide Settings" : "Show Settings"}
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Sales Trends Period (Months)
                </label>
                <select
                  value={monthsRange}
                  onChange={(e) => setMonthsRange(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="3">Last 3 months</option>
                  <option value="6">Last 6 months</option>
                  <option value="12">Last 12 months</option>
                  <option value="24">Last 24 months</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Forecast Period (Months Ahead)
                </label>
                <select
                  value={forecastMonths}
                  onChange={(e) => setForecastMonths(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="3">Next 3 months</option>
                  <option value="6">Next 6 months</option>
                  <option value="12">Next 12 months</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Top Products Limit
                </label>
                <Input
                  type="number"
                  min="5"
                  max="50"
                  value={bestSellersLimit}
                  onChange={(e) => setBestSellersLimit(parseInt(e.target.value) || 10)}
                  className="text-gray-900"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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

      {/* Side by Side Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        {paymentChartData.length > 0 && (
          <CustomerInsightChart
            data={paymentChartData}
            title="Payment Methods Analysis"
            valueLabel="Revenue (SLL)"
          />
        )}

        {/* Best Selling Products */}
        {productsChartData.length > 0 && (
          <CustomerInsightChart
            data={productsChartData}
            title="Best Selling Products"
            valueLabel="Quantity Sold"
          />
        )}
      </div>

      {/* Payment Methods Details */}
      {paymentMethods.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Payment Methods Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paymentMethods.map((pm) => (
                <div key={pm.method} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{pm.method.replace("_", " ")}</div>
                      <div className="text-sm text-gray-600">
                        {pm.count} transactions
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "SLL",
                        minimumFractionDigits: 0,
                      }).format(pm.totalAmount)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {pm.percentage.toFixed(1)}% of total
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Best Selling Products Details */}
      {bestSellers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-600" />
              Best Selling Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bestSellers.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{product.productName}</div>
                      <div className="text-sm text-gray-600">
                        {product.totalQuantity} units sold
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "SLL",
                        minimumFractionDigits: 0,
                      }).format(product.totalRevenue)}
                    </div>
                    <div className="text-sm text-gray-600">Total revenue</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

