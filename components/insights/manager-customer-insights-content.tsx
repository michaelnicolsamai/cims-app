"use client";

import { useState } from "react";
import { CustomerInsightsView } from "@/components/insights/customer-insights-view";
import { KeyInsightsView } from "@/components/insights/key-insights-view";
import { Users, TrendingUp, DollarSign, AlertTriangle, Filter, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ManagerCustomerInsightsContent() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    topSpenders: 0,
    highLoyalty: 0,
    atRisk: 0,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    segment: "",
    minLoyalty: "",
    maxLoyalty: "",
    churnRisk: "",
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Customer Insights
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Comprehensive analysis of your customer base with advanced analytics and segmentation
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalCustomers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Top Spenders</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.topSpenders}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Loyalty</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.highLoyalty}</p>
                <p className="text-xs text-gray-500 mt-1">Score ≥ 70</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">At Risk</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.atRisk}</p>
                <p className="text-xs text-gray-500 mt-1">High/Critical</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Insights - Colored alert cards & Customer Analysis Summary */}
      <KeyInsightsView />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-900">Advanced Filters</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Customer Segment
                </label>
                <select
                  value={filters.segment}
                  onChange={(e) => setFilters({ ...filters, segment: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Segments</option>
                  <option value="Champions">Champions</option>
                  <option value="Loyal_Customers">Loyal Customers</option>
                  <option value="Potential_Loyalists">Potential Loyalists</option>
                  <option value="New_Customers">New Customers</option>
                  <option value="Promising">Promising</option>
                  <option value="Need_Attention">Need Attention</option>
                  <option value="About_to_Sleep">About to Sleep</option>
                  <option value="At_Risk">At Risk</option>
                  <option value="Cannot_Lose_Them">Cannot Lose Them</option>
                  <option value="Hibernating">Hibernating</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Min Loyalty Score
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.minLoyalty}
                  onChange={(e) => setFilters({ ...filters, minLoyalty: e.target.value })}
                  placeholder="0"
                  className="text-gray-900"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Max Loyalty Score
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.maxLoyalty}
                  onChange={(e) => setFilters({ ...filters, maxLoyalty: e.target.value })}
                  placeholder="100"
                  className="text-gray-900"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Churn Risk Level
                </label>
                <select
                  value={filters.churnRisk}
                  onChange={(e) => setFilters({ ...filters, churnRisk: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Risk Levels</option>
                  <option value="LOW">Low Risk</option>
                  <option value="MEDIUM">Medium Risk</option>
                  <option value="HIGH">High Risk</option>
                  <option value="CRITICAL">Critical Risk</option>
                </select>
              </div>
            </div>
          )}

          {(filters.segment || filters.minLoyalty || filters.maxLoyalty || filters.churnRisk) && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600">Active filters:</span>
                {filters.segment && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    Segment: {filters.segment.replace("_", " ")}
                    <button
                      onClick={() => setFilters({ ...filters, segment: "" })}
                      className="ml-1 hover:text-blue-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.minLoyalty && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    Min Loyalty: {filters.minLoyalty}
                    <button
                      onClick={() => setFilters({ ...filters, minLoyalty: "" })}
                      className="ml-1 hover:text-blue-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.maxLoyalty && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    Max Loyalty: {filters.maxLoyalty}
                    <button
                      onClick={() => setFilters({ ...filters, maxLoyalty: "" })}
                      className="ml-1 hover:text-blue-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.churnRisk && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    Risk: {filters.churnRisk}
                    <button
                      onClick={() => setFilters({ ...filters, churnRisk: "" })}
                      className="ml-1 hover:text-blue-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters({ segment: "", minLoyalty: "", maxLoyalty: "", churnRisk: "" })}
                  className="text-sm"
                >
                  Clear All
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CustomerInsightsView 
        showStats={true} 
        onStatsUpdate={setStats}
        filters={filters}
      />
    </div>
  );
}

