"use client";

import { useEffect, useState } from "react";
import { useRoutes } from "@/lib/hooks/use-routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChurnRiskIndicator } from "@/components/analytics/ChurnRiskIndicator";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, AlertCircle, Info, CheckCircle, ArrowRight } from "lucide-react";

interface ChurnCustomer {
  customerId: string;
  customerName: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskScore: number;
  factors: string[];
  recommendations: string[];
  totalSpent: number;
  daysSinceLastVisit: number | null;
  loyaltyScore: number;
}

export function ChurnRiskView() {
  const routes = useRoutes();
  const [customers, setCustomers] = useState<ChurnCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChurnData() {
      try {
        const res = await fetch("/api/analytics/customers/insights?limit=100");
        const data = await res.json();
        if (data.success) {
          const withChurn = (data.data || []).map((i: any) => ({
            customerId: i.customerId,
            customerName: i.customerName,
            riskLevel: i.churnRisk?.riskLevel || "LOW",
            riskScore: i.churnRisk?.riskScore || 0,
            factors: i.churnRisk?.factors || [],
            recommendations: i.churnRisk?.recommendations || [],
            totalSpent: i.totalSpent || 0,
            daysSinceLastVisit: i.daysSinceLastVisit,
            loyaltyScore: i.loyaltyScore || 0,
          }));
          setCustomers(withChurn);
        }
      } catch (error) {
        console.error("Error fetching churn data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchChurnData();
  }, []);

  const grouped = {
    CRITICAL: customers.filter((c) => c.riskLevel === "CRITICAL"),
    HIGH: customers.filter((c) => c.riskLevel === "HIGH"),
    MEDIUM: customers.filter((c) => c.riskLevel === "MEDIUM"),
    LOW: customers.filter((c) => c.riskLevel === "LOW"),
  };

  const stats = {
    critical: grouped.CRITICAL.length,
    high: grouped.HIGH.length,
    medium: grouped.MEDIUM.length,
    low: grouped.LOW.length,
    totalAtRisk: grouped.CRITICAL.length + grouped.HIGH.length + grouped.MEDIUM.length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Risk Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 font-medium">Critical Risk</p>
                <p className="text-2xl font-bold text-red-900">{stats.critical}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600 opacity-60" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700 font-medium">High Risk</p>
                <p className="text-2xl font-bold text-orange-900">{stats.high}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-600 opacity-60" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700 font-medium">Medium Risk</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.medium}</p>
              </div>
              <Info className="w-8 h-8 text-yellow-600 opacity-60" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">Low Risk</p>
                <p className="text-2xl font-bold text-green-900">{stats.low}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Banner */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-blue-900">
            <strong>Churn Prediction & Risk Indicators:</strong> Risk scores and categories (high/medium/low) support fast managerial interpretation and proactive retention follow-up. Focus on Critical and High risk customers for retention campaigns.
          </p>
        </CardContent>
      </Card>

      {/* At-Risk Customers (Critical & High) - Primary focus for screenshots */}
      {(grouped.CRITICAL.length > 0 || grouped.HIGH.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Customers Requiring Retention Action
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {stats.totalAtRisk} customer{stats.totalAtRisk !== 1 ? "s" : ""} at medium or higher churn risk
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...grouped.CRITICAL, ...grouped.HIGH].map((customer) => (
                <div key={customer.customerId} className="border rounded-lg p-4 bg-white shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{customer.customerName}</h3>
                    <Link href={routes.customersInsights(customer.customerId)}>
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                  <ChurnRiskIndicator
                    riskLevel={customer.riskLevel}
                    riskScore={customer.riskScore}
                    factors={customer.factors.slice(0, 2)}
                    recommendations={customer.recommendations.slice(0, 1)}
                  />
                  <div className="mt-3 flex justify-between text-xs text-gray-600">
                    <span>Loyalty: {customer.loyaltyScore}/100</span>
                    <span>Total Spent: Le {customer.totalSpent.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Medium Risk Section */}
      {grouped.MEDIUM.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Medium Risk Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-gray-700">Customer</th>
                    <th className="text-left py-2 font-medium text-gray-700">Risk Score</th>
                    <th className="text-left py-2 font-medium text-gray-700">Days Since Visit</th>
                    <th className="text-left py-2 font-medium text-gray-700">Key Factor</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped.MEDIUM.map((c) => (
                    <tr key={c.customerId} className="border-b">
                      <td className="py-2">
                        <Link href={routes.customersInsights(c.customerId)} className="text-blue-600 hover:underline">
                          {c.customerName}
                        </Link>
                      </td>
                      <td className="py-2">{c.riskScore}/100</td>
                      <td className="py-2">{c.daysSinceLastVisit ?? "—"}</td>
                      <td className="py-2 text-gray-600">{c.factors[0] || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {customers.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg">No churn risk data available.</p>
          <p className="text-sm mt-2">Customer insights are generated from sales and visit history.</p>
        </div>
      )}
    </div>
  );
}
