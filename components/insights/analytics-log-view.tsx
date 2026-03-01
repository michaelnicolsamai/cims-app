"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, FileText, Calendar, Filter, Play } from "lucide-react";
import { format } from "date-fns";

const ANALYTICS_TYPES_TO_GENERATE = [
  "TOP_CUSTOMERS",
  "SALES_TREND_MONTHLY",
  "CUSTOMER_CHURN_RISK",
  "REVENUE_FORECAST",
  "BEST_SELLING_PRODUCTS",
];

interface AnalyticsLogEntry {
  id: string;
  type: string;
  period: string;
  title: string | null;
  summary: string | null;
  generatedAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  TOP_CUSTOMERS: "Top Customers",
  SALES_TREND_MONTHLY: "Sales Trend (Monthly)",
  CUSTOMER_CHURN_RISK: "Churn Risk Analysis",
  REVENUE_FORECAST: "Revenue Forecast",
  BEST_SELLING_PRODUCTS: "Best Selling Products",
  RETURNING_CUSTOMERS: "Returning Customers",
  PAYMENT_METHODS_ANALYSIS: "Payment Methods",
  REGIONAL_SALES: "Regional Sales",
  CUSTOMER_ACQUISITION: "Customer Acquisition",
  INVENTORY_ALERTS: "Inventory Alerts",
};

export function AnalyticsLogView() {
  const [logs, setLogs] = useState<AnalyticsLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const params = new URLSearchParams();
        if (filterType) params.set("type", filterType);
        const res = await fetch(`/api/analytics/logs?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          setLogs(data.data);
        }
      } catch (error) {
        console.error("Error fetching analytics logs:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, [filterType]);

  async function fetchLogsInternal() {
    try {
      const params = new URLSearchParams();
      if (filterType) params.set("type", filterType);
      const res = await fetch(`/api/analytics/logs?${params.toString()}`);
      const data = await res.json();
      if (data.success) setLogs(data.data);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleGenerateSample() {
    setGenerating(true);
    try {
      for (const type of ANALYTICS_TYPES_TO_GENERATE) {
        await fetch("/api/analytics/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, period: format(new Date(), "yyyy-MM") }),
        });
      }
      await fetchLogsInternal();
    } catch (e) {
      console.error("Failed to generate analytics:", e);
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-blue-900">
            <strong>Analytics History & Insight Logs:</strong> CIMS maintains an analytics history log that records executed analyses, timestamps, and stored outputs. Review previous results without re-running analytical tasks, supporting auditability and consistent decision-making.
          </p>
        </CardContent>
      </Card>

      {/* Filter and Generate */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">Filter by type:</label>
              <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            </div>
            <Button
              onClick={handleGenerateSample}
              disabled={generating}
              variant="outline"
              size="sm"
              title="Run sample analyses to populate this log"
            >
              {generating ? "Generating…" : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Sample Analyses
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Log Entries */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-gray-600" />
            <CardTitle className="text-lg font-semibold text-gray-900">
              Executed Analyses
            </CardTitle>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {logs.length} log entr{logs.length === 1 ? "y" : "ies"}
          </p>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg">No analytics history yet.</p>
              <p className="text-sm mt-2">
                Run analyses from Sales Analytics or generate reports to populate this log.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">
                        {log.title || TYPE_LABELS[log.type] || log.type}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {TYPE_LABELS[log.type] || log.type}
                      </span>
                    </div>
                    {log.summary && (
                      <p className="text-sm text-gray-600 mt-1 truncate max-w-xl">
                        {log.summary}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(log.generatedAt), "MMM d, yyyy HH:mm")}
                      </span>
                      {log.period && (
                        <span>Period: {log.period}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
