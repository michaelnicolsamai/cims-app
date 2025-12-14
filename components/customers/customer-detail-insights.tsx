"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoyaltyScoreCard } from "@/components/analytics/LoyaltyScoreCard";
import { ChurnRiskIndicator } from "@/components/analytics/ChurnRiskIndicator";
import { CustomerInsightChart } from "@/components/analytics/CustomerInsightChart";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface CustomerInsight {
  customerId: string;
  customerName: string;
  loyaltyScore: number;
  churnRisk: any;
  segment: string;
  totalSpent: number;
  totalVisits: number;
  averageOrderValue: number;
  lastVisitDate: string | null;
  daysSinceLastVisit: number | null;
  preferredPaymentMethod: string | null;
  topProducts: Array<{ productName: string; quantity: number }>;
  growthTrend: string;
}

export function CustomerDetailInsights({ customerId }: { customerId: string }) {
  const [insight, setInsight] = useState<CustomerInsight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInsight() {
      try {
        const res = await fetch(`/api/customers/${customerId}/insights`);
        const data = await res.json();
        if (data.success) {
          setInsight(data.data);
        }
      } catch (error) {
        console.error("Error fetching customer insight:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchInsight();
  }, [customerId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  if (!insight) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Customer insights not found
          </p>
        </CardContent>
      </Card>
    );
  }

  const topProductsData = insight.topProducts.map((p) => ({
    name: p.productName,
    value: p.quantity,
  }));

  return (
    <div className="space-y-6">
      <Link href="/dashboard/admin/insights/customers">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Customer Insights
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loyalty Score */}
        <LoyaltyScoreCard
          score={insight.loyaltyScore}
          customerName={insight.customerName}
        />

        {/* Churn Risk */}
        <ChurnRiskIndicator
          riskLevel={insight.churnRisk.riskLevel}
          riskScore={insight.churnRisk.riskScore}
          factors={insight.churnRisk.factors}
          recommendations={insight.churnRisk.recommendations}
        />
      </div>

      {/* Customer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              Le {insight.totalSpent.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700">Total Visits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{insight.totalVisits}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700">Avg Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              Le {insight.averageOrderValue.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700">Segment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{insight.segment}</div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Last Visit:</span>
              <span className="font-medium text-gray-900">
                {insight.lastVisitDate
                  ? new Date(insight.lastVisitDate).toLocaleDateString()
                  : "Never"}
              </span>
            </div>
            {insight.daysSinceLastVisit !== null && (
              <div className="flex justify-between">
                <span className="text-gray-600">Days Since Last Visit:</span>
                <span className="font-medium text-gray-900">{insight.daysSinceLastVisit} days</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Preferred Payment:</span>
              <span className="font-medium text-gray-900">
                {insight.preferredPaymentMethod?.replace("_", " ") || "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Growth Trend:</span>
              <span className="font-medium text-gray-900">{insight.growthTrend}</span>
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        {topProductsData.length > 0 && (
          <CustomerInsightChart
            data={topProductsData}
            title="Top Products Purchased"
            valueLabel="Quantity"
          />
        )}
      </div>
    </div>
  );
}

