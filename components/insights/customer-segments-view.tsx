"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerSegmentChart } from "@/components/analytics/CustomerSegmentChart";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

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

  return (
    <div className="space-y-6">
      {/* Segment Chart */}
      {segments.length > 0 && <CustomerSegmentChart data={segments} />}

      {/* Segment Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {segments.map((segment) => (
          <Card key={segment.segment}>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                {segment.segment.replace("_", " ")} Customers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Count:</span>
                  <span className="font-semibold text-gray-900">{segment.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Value:</span>
                  <span className="font-semibold text-gray-900">
                    Le {segment.totalValue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Value:</span>
                  <span className="font-semibold text-gray-900">
                    Le {segment.averageValue.toLocaleString()}
                  </span>
                </div>
              </div>

              {segment.customers.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2 text-gray-900">Top Customers:</div>
                  <div className="space-y-2">
                    {segment.customers.slice(0, 5).map((customer) => (
                      <div
                        key={customer.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <Link
                          href={`/dashboard/admin/customers/${customer.id}/insights`}
                          className="text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          {customer.name}
                        </Link>
                        <div className="text-gray-600">
                          Le {customer.totalSpent.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                  {segment.customers.length > 5 && (
                    <div className="mt-2 text-xs text-gray-500">
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
  );
}

