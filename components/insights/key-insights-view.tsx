"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, TrendingUp, FileText, LineChart } from "lucide-react";

interface AutomatedInsight {
  type: string;
  title: string;
  summary: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  recommendations: string[];
  data?: any;
}

function getInsightCardStyle(insight: AutomatedInsight): {
  bg: string;
  border: string;
  icon: typeof AlertTriangle;
  iconColor: string;
} {
  const typeStr = typeof insight.type === "string" ? insight.type : "";
  const isChurnOrRisk =
    typeStr === "CUSTOMER_CHURN_RISK" ||
    insight.title.toLowerCase().includes("churn") ||
    insight.title.toLowerCase().includes("risk") ||
    insight.title.toLowerCase().includes("decline") ||
    insight.title.toLowerCase().includes("lost");

  const isRevenueOrGrowth =
    typeStr === "REVENUE_FORECAST" ||
    typeStr === "SALES_TREND_MONTHLY" ||
    insight.title.toLowerCase().includes("revenue") ||
    insight.title.toLowerCase().includes("growth") ||
    insight.title.toLowerCase().includes("forecast");

  if (isChurnOrRisk || insight.priority === "HIGH") {
    return {
      bg: "bg-red-50",
      border: "border-red-200",
      icon: AlertTriangle,
      iconColor: "text-red-600",
    };
  }

  if (isRevenueOrGrowth) {
    return {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: LineChart,
      iconColor: "text-blue-600",
    };
  }

  return {
    bg: "bg-slate-50",
    border: "border-slate-200",
    icon: FileText,
    iconColor: "text-slate-600",
  };
}

export function KeyInsightsView() {
  const [insights, setInsights] = useState<AutomatedInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInsights() {
      try {
        const res = await fetch("/api/analytics/insights/automated");
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setInsights(data.data);
        }
      } catch (error) {
        console.error("Error fetching key insights:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (insights.length === 0) {
    return null;
  }

  // Build summary bullets for Generated Report
  const churnInsight = insights.find(
    (i) =>
      (typeof i.type === "string" && i.type === "CUSTOMER_CHURN_RISK") ||
      i.title.toLowerCase().includes("churn") ||
      i.title.toLowerCase().includes("risk")
  );
  const revenueInsight = insights.find(
    (i) =>
      (typeof i.type === "string" && i.type === "REVENUE_FORECAST") ||
      i.title.toLowerCase().includes("revenue") ||
      i.title.toLowerCase().includes("forecast") ||
      i.title.toLowerCase().includes("growth")
  );
  const topRec = [...(churnInsight?.recommendations || []), ...(revenueInsight?.recommendations || [])][0];

  return (
    <div className="space-y-6">
      {/* Key Insights - Colored alert cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.slice(0, 4).map((insight, idx) => {
            const style = getInsightCardStyle(insight);
            const Icon = style.icon;
            const recText = insight.recommendations?.[0];
            const recSentence = recText
              ? ` It's recommended to ${recText.charAt(0).toLowerCase() + recText.slice(1).replace(/\.$/, "")}.`
              : "";
            const fullSummary = insight.summary + recSentence;

            return (
              <Card
                key={idx}
                className={`${style.bg} ${style.border} border-2 shadow-sm`}
              >
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className={`flex-shrink-0 ${style.iconColor}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {insight.title}
                      </h3>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {fullSummary}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Generated Report - Customer Analysis Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-600" />
            Customer Analysis Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm text-gray-700">
            {churnInsight && (
              <li>
                <strong className="text-gray-900">Churn Rate:</strong>{" "}
                {churnInsight.summary}
              </li>
            )}
            {revenueInsight && (
              <li>
                <strong className="text-gray-900">Revenue Forecast:</strong>{" "}
                {revenueInsight.summary}
              </li>
            )}
            {!churnInsight && !revenueInsight && insights[0] && (
              <li>
                <strong className="text-gray-900">Overview:</strong>{" "}
                {insights[0].summary}
              </li>
            )}
            <li>
              <strong className="text-gray-900">Recommendation:</strong>{" "}
              {topRec ||
                (churnInsight?.recommendations?.[0]) ||
                (revenueInsight?.recommendations?.[0]) ||
                "Focus on retention strategies for high-risk customers to mitigate churn."}
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
