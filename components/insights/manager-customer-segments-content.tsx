"use client";

import { useState, useEffect } from "react";
import { CustomerSegmentsView } from "@/components/insights/customer-segments-view";
import { Users, DollarSign, TrendingUp, BarChart3, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SegmentStats {
  totalCustomers: number;
  totalValue: number;
  averageValue: number;
  topSegment: string;
}

export function ManagerCustomerSegmentsContent() {
  const [segments, setSegments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SegmentStats | null>(null);

  useEffect(() => {
    async function fetchSegments() {
      try {
        const res = await fetch("/api/analytics/customers/segments");
        const data = await res.json();
        if (data.success) {
          setSegments(data.data);
          
          // Calculate stats
          const totalCustomers = data.data.reduce((sum: number, s: any) => sum + s.count, 0);
          const totalValue = data.data.reduce((sum: number, s: any) => sum + s.totalValue, 0);
          const averageValue = totalCustomers > 0 ? totalValue / totalCustomers : 0;
          const topSegment = data.data.length > 0 
            ? data.data.reduce((max: any, s: any) => s.count > max.count ? s : max, data.data[0])
            : null;

          setStats({
            totalCustomers,
            totalValue,
            averageValue,
            topSegment: topSegment?.segment || "",
          });
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading customer segments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Customer Segments
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                RFM-based customer segmentation analysis with actionable insights
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Segmented</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalCustomers}</p>
                  <p className="text-xs text-gray-500 mt-1">customers</p>
                </div>
                <Users className="w-8 h-8 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Segment Value</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "SLL",
                      minimumFractionDigits: 0,
                    }).format(stats.totalValue)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Customer Value</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "SLL",
                      minimumFractionDigits: 0,
                    }).format(stats.averageValue)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Largest Segment</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {stats.topSegment.replace("_", " ")}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {segments.find(s => s.segment === stats.topSegment)?.count || 0} customers
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-orange-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">About RFM Segmentation</h3>
              <p className="text-sm text-blue-700">
                Customers are segmented using RFM (Recency, Frequency, Monetary) analysis. 
                Segments include Champions (best customers), Loyal Customers, Potential Loyalists, 
                New Customers, At Risk customers, and more. Each segment has specific characteristics 
                and recommended marketing strategies.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <CustomerSegmentsView />
    </div>
  );
}

