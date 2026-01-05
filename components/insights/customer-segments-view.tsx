"use client";

import { useEffect, useState } from "react";
import { useRoutes } from "@/lib/hooks/use-routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerSegmentChart } from "@/components/analytics/CustomerSegmentChart";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, DollarSign, TrendingUp } from "lucide-react";

interface CustomerSegmentData {
  segment: string;
  count: number;
  totalValue: number;
  averageValue: number;
  customers: Array<{
    id: string;
    name: string;
    totalSpent: number;
    loyaltyScore: number;
  }>;
}

export function CustomerSegmentsView() {
  const routes = useRoutes();
  const [segments, setSegments] = useState<CustomerSegmentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSegments() {
      try {
        const res = await fetch("/api/analytics/customers/segments");
        const data = await res.json();
        if (data.success) {
          setSegments(data.data);
        }
      } catch (error) {
        console.error("Error fetching segments:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSegments();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  if (segments.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 text-lg">No customer segments found</p>
        <p className="text-gray-500 text-sm mt-2">
          Customer segments will be generated based on RFM analysis
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Segment Chart */}
      {segments.length > 0 && (
        <div className="w-full">
          <CustomerSegmentChart data={segments} />
        </div>
      )}

      {/* Segment Details */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Segment Details {segments.length > 0 && (
              <span className="text-sm font-normal text-gray-600">
                ({segments.length} {segments.length === 1 ? 'segment' : 'segments'})
              </span>
            )}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {segments.map((segment) => (
            <Card key={segment.segment} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {segment.segment.replace(/_/g, " ")} Customers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span className="text-xs text-gray-600">Count</span>
                    </div>
                    <div className="text-xl font-bold text-gray-900">{segment.count}</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-gray-600">Total Value</span>
                    </div>
                    <div className="text-sm font-bold text-gray-900">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "SLL",
                        minimumFractionDigits: 0,
                      }).format(segment.totalValue)}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <span className="text-xs text-gray-600">Average Value</span>
                  </div>
                  <div className="text-sm font-bold text-gray-900">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "SLL",
                      minimumFractionDigits: 0,
                    }).format(segment.averageValue)}
                  </div>
                </div>

                {segment.customers.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="text-sm font-medium mb-3 text-gray-900">Top Customers:</div>
                    <div className="space-y-2">
                      {segment.customers.slice(0, 5).map((customer, index) => (
                        <div
                          key={customer.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-500 w-5">
                              #{index + 1}
                            </span>
                            <Link
                              href={routes.customersInsights(customer.id)}
                              className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium"
                            >
                              {customer.name}
                            </Link>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-900">
                              {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "SLL",
                                minimumFractionDigits: 0,
                              }).format(customer.totalSpent)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Score: {customer.loyaltyScore}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {segment.customers.length > 5 && (
                      <div className="mt-2 text-xs text-gray-500 text-center">
                        +{segment.customers.length - 5} more customers
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

