"use client";

import { useEffect, useState } from "react";
import { useRoutes } from "@/lib/hooks/use-routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoyaltyScoreCard } from "@/components/analytics/LoyaltyScoreCard";
import { ChurnRiskIndicator } from "@/components/analytics/ChurnRiskIndicator";
import { CustomerInsightChart } from "@/components/analytics/CustomerInsightChart";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

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

interface CustomerInsightsViewProps {
  showStats?: boolean;
  onStatsUpdate?: (stats: {
    totalCustomers: number;
    topSpenders: number;
    highLoyalty: number;
    atRisk: number;
  }) => void;
  filters?: {
    segment?: string;
    minLoyalty?: string;
    maxLoyalty?: string;
    churnRisk?: string;
  };
  sortBy?: "totalSpent" | "loyaltyScore" | "totalVisits" | "averageOrderValue";
  sortOrder?: "asc" | "desc";
}

export function CustomerInsightsView({ 
  showStats = false, 
  onStatsUpdate,
  filters = {},
  sortBy = "totalSpent",
  sortOrder = "desc"
}: CustomerInsightsViewProps) {
  const routes = useRoutes();
  const [insights, setInsights] = useState<CustomerInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentSort, setCurrentSort] = useState<{ by: typeof sortBy; order: typeof sortOrder }>({ by: sortBy, order: sortOrder });

  useEffect(() => {
    async function fetchInsights() {
      try {
        const res = await fetch("/api/analytics/customers/insights?limit=50");
        const data = await res.json();
        if (data.success) {
          setInsights(data.data);
          
          // Calculate stats
          if (onStatsUpdate || showStats) {
            const totalCustomers = data.data.length;
            const topSpenders = data.data.filter((c: CustomerInsight) => c.totalSpent > 0).length;
            const highLoyalty = data.data.filter((c: CustomerInsight) => c.loyaltyScore >= 70).length;
            const atRisk = data.data.filter((c: CustomerInsight) => 
              c.churnRisk?.riskLevel === "HIGH" || c.churnRisk?.riskLevel === "CRITICAL"
            ).length;
            
            if (onStatsUpdate) {
              onStatsUpdate({ totalCustomers, topSpenders, highLoyalty, atRisk });
            }
          }
        }
      } catch (error) {
        console.error("Error fetching customer insights:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchInsights();
  }, []);

  // Update stats when filters change
  useEffect(() => {
    if (onStatsUpdate || showStats) {
      const filtered = insights.filter((insight) => {
        if (filters.segment && insight.segment !== filters.segment) return false;
        if (filters.minLoyalty && insight.loyaltyScore < parseInt(filters.minLoyalty)) return false;
        if (filters.maxLoyalty && insight.loyaltyScore > parseInt(filters.maxLoyalty)) return false;
        if (filters.churnRisk && insight.churnRisk?.riskLevel !== filters.churnRisk) return false;
        return true;
      });

      const totalCustomers = filtered.length;
      const topSpenders = filtered.filter((c: CustomerInsight) => c.totalSpent > 0).length;
      const highLoyalty = filtered.filter((c: CustomerInsight) => c.loyaltyScore >= 70).length;
      const atRisk = filtered.filter((c: CustomerInsight) => 
        c.churnRisk?.riskLevel === "HIGH" || c.churnRisk?.riskLevel === "CRITICAL"
      ).length;
      
      if (onStatsUpdate) {
        onStatsUpdate({ totalCustomers, topSpenders, highLoyalty, atRisk });
      }
    }
  }, [insights, filters, onStatsUpdate, showStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  // Filter and sort insights
  let filteredInsights = insights.filter((insight) => {
    // Search filter
    const matchesSearch = 
      insight.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insight.segment.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    // Segment filter
    if (filters.segment && insight.segment !== filters.segment) {
      return false;
    }

    // Loyalty score filters
    if (filters.minLoyalty && insight.loyaltyScore < parseInt(filters.minLoyalty)) {
      return false;
    }
    if (filters.maxLoyalty && insight.loyaltyScore > parseInt(filters.maxLoyalty)) {
      return false;
    }

    // Churn risk filter
    if (filters.churnRisk && insight.churnRisk?.riskLevel !== filters.churnRisk) {
      return false;
    }

    return true;
  });

  // Sort insights
  filteredInsights = [...filteredInsights].sort((a, b) => {
    let aValue: number;
    let bValue: number;

    switch (currentSort.by) {
      case "totalSpent":
        aValue = a.totalSpent;
        bValue = b.totalSpent;
        break;
      case "loyaltyScore":
        aValue = a.loyaltyScore;
        bValue = b.loyaltyScore;
        break;
      case "totalVisits":
        aValue = a.totalVisits;
        bValue = b.totalVisits;
        break;
      case "averageOrderValue":
        aValue = a.averageOrderValue;
        bValue = b.averageOrderValue;
        break;
      default:
        aValue = a.totalSpent;
        bValue = b.totalSpent;
    }

    if (currentSort.order === "asc") {
      return aValue - bValue;
    } else {
      return bValue - aValue;
    }
  });

  const topCustomers = filteredInsights.slice(0, 5);
  const chartData = topCustomers.map((c) => ({
    name: c.customerName,
    value: c.totalSpent,
  }));

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          type="text"
          placeholder="Search customers by name or segment..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {/* Top Customers Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Top Customers by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerInsightChart
              data={chartData}
              title="Top Customers by Revenue"
              valueLabel="Total Spent (SLL)"
            />
          </CardContent>
        </Card>
      )}

      {/* Results Count */}
      {filteredInsights.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No customers found matching your search.</p>
        </div>
      )}

      {/* Customer Cards */}
      {filteredInsights.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Customer Insights {filteredInsights.length > 0 && (
                <span className="text-sm font-normal text-gray-600">
                  ({filteredInsights.length} {filteredInsights.length === 1 ? 'customer' : 'customers'})
                </span>
              )}
            </h2>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Sort by:</label>
              <select
                value={currentSort.by}
                onChange={(e) => setCurrentSort({ ...currentSort, by: e.target.value as typeof sortBy })}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="totalSpent">Total Spent</option>
                <option value="loyaltyScore">Loyalty Score</option>
                <option value="totalVisits">Total Visits</option>
                <option value="averageOrderValue">Avg Order Value</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentSort({ ...currentSort, order: currentSort.order === "asc" ? "desc" : "asc" })}
              >
                {currentSort.order === "asc" ? "↑" : "↓"}
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInsights.map((insight) => (
          <Card key={insight.customerId}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">{insight.customerName}</CardTitle>
                <Link href={routes.customersInsights(insight.customerId)}>
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
      )}
    </div>
  );
}

