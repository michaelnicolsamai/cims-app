"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoyaltyScoreCard } from "@/components/analytics/LoyaltyScoreCard";
import { ChurnRiskIndicator } from "@/components/analytics/ChurnRiskIndicator";
import { CustomerInsightChart } from "@/components/analytics/CustomerInsightChart";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface CustomerInsight {
  customerId: string;
  customerName: string;
  loyaltyScore: number;
  churnRisk: any;
  segment: string;
  totalSpent: number;
  totalVisits: number;
  averageOrderValue: number;
}

export function CustomerInsightsView() {
  const [insights, setInsights] = useState<CustomerInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInsights() {
      try {
        const res = await fetch("/api/analytics/customers/insights?limit=20");
        const data = await res.json();
        if (data.success) {
          setInsights(data.data);
        }
      } catch (error) {
        console.error("Error fetching customer insights:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  const topCustomers = insights.slice(0, 5);
  const chartData = topCustomers.map((c) => ({
    name: c.customerName,
    value: c.totalSpent,
  }));

  return (
    <div className="space-y-6">
      {/* Top Customers Chart */}
      {chartData.length > 0 && (
        <CustomerInsightChart
          data={chartData}
          title="Top Customers by Revenue"
          valueLabel="Total Spent (SLL)"
        />
      )}

      {/* Customer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {insights.slice(0, 6).map((insight) => (
          <Card key={insight.customerId}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">{insight.customerName}</CardTitle>
                <Link href={`/dashboard/admin/customers/${insight.customerId}/insights`}>
                  <Button variant="ghost" size="sm">
                    View Details
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <LoyaltyScoreCard score={insight.loyaltyScore} />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Total Spent</div>
                  <div className="font-semibold text-gray-900">
                    Le {insight.totalSpent.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Total Visits</div>
                  <div className="font-semibold text-gray-900">{insight.totalVisits}</div>
                </div>
                <div>
                  <div className="text-gray-600">Avg Order Value</div>
                  <div className="font-semibold text-gray-900">
                    Le {insight.averageOrderValue.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Segment</div>
                  <div className="font-semibold text-gray-900">{insight.segment}</div>
                </div>
              </div>
              <ChurnRiskIndicator
                riskLevel={insight.churnRisk.riskLevel}
                riskScore={insight.churnRisk.riskScore}
                factors={insight.churnRisk.factors.slice(0, 2)}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

