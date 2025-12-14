"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SalesTrendChart } from "@/components/analytics/SalesTrendChart";
import { RevenueForecastChart } from "@/components/analytics/RevenueForecastChart";
import { CustomerInsightChart } from "@/components/analytics/CustomerInsightChart";

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

export function SalesAnalyticsView() {
  const [salesTrends, setSalesTrends] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodAnalysis[]>([]);
  const [bestSellers, setBestSellers] = useState<BestSellingProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSalesData() {
      try {
        const [trendsRes, forecastRes, paymentRes, productsRes] = await Promise.all([
          fetch("/api/analytics/sales/trends?months=12"),
          fetch("/api/analytics/sales/forecast?monthsAhead=6"),
          fetch("/api/analytics/sales/payment-methods"),
          fetch("/api/analytics/sales/best-products"),
        ]);

        const trendsData = await trendsRes.json();
        const forecastData = await forecastRes.json();
        const paymentData = await paymentRes.json();
        const productsData = await productsRes.json();

        if (trendsData.success) setSalesTrends(trendsData.data);
        if (forecastData.success) setForecast(forecastData.data);
        if (paymentData.success) setPaymentMethods(paymentData.data);
        if (productsData.success) setBestSellers(productsData.data);
      } catch (error) {
        console.error("Error fetching sales data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSalesData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  const paymentChartData = paymentMethods.map((pm) => ({
    name: pm.method.replace("_", " "),
    value: pm.totalAmount,
  }));

  const productsChartData = bestSellers.slice(0, 10).map((p) => ({
    name: p.productName,
    value: p.totalQuantity,
  }));

  return (
    <div className="space-y-6">
      {/* Sales Trends */}
      {salesTrends.length > 0 && <SalesTrendChart data={salesTrends} />}

      {/* Revenue Forecast */}
      {forecast.length > 0 && <RevenueForecastChart data={forecast} />}

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
            <CardTitle className="text-lg font-semibold text-gray-900">Payment Methods Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentMethods.map((pm) => (
                <div key={pm.method} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium text-gray-900">{pm.method.replace("_", " ")}</div>
                    <div className="text-sm text-gray-600">
                      {pm.count} transactions
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      Le {pm.totalAmount.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      {pm.percentage.toFixed(1)}%
                    </div>
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

