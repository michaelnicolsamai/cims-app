"use client";

import { useState } from "react";
import { CustomerInsightsView } from "@/components/insights/customer-insights-view";
import { Users, TrendingUp, DollarSign, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function StaffCustomerInsightsContent() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    topSpenders: 0,
    highLoyalty: 0,
    atRisk: 0,
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Customer Insights
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              View customer loyalty, spending patterns, and key information to improve service
            </p>
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
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <CustomerInsightsView 
        showStats={true} 
        onStatsUpdate={setStats}
      />
    </div>
  );
}

