"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface CustomerSegmentData {
  segment: string;
  count: number;
  totalValue: number;
  averageValue: number;
}

interface CustomerSegmentChartProps {
  data: CustomerSegmentData[];
}

const COLORS: { [key: string]: string } = {
  Champions: "#10b981",
  "Loyal Customers": "#3b82f6",
  "Potential Loyalists": "#8b5cf6",
  "New Customers": "#f59e0b",
  Promising: "#06b6d4",
  "Need Attention": "#f97316",
  "About to Sleep": "#ec4899",
  "At Risk": "#ef4444",
  "Cannot Lose Them": "#dc2626",
  Hibernating: "#6b7280",
  Lost: "#374151",
  // Handle underscore versions
  "VIP": "#8884d8",
  "LOYAL": "#82ca9d",
  "REGULAR": "#ffc658",
  "NEW": "#ff7c7c",
  "AT_RISK": "#ff8042",
  "INACTIVE": "#8dd1e1",
  "Champions": "#10b981",
  "Loyal_Customers": "#3b82f6",
  "Potential_Loyalists": "#8b5cf6",
  "New_Customers": "#f59e0b",
  "Promising": "#06b6d4",
  "Need_Attention": "#f97316",
  "About_to_Sleep": "#ec4899",
  "Cannot_Lose_Them": "#dc2626",
};

export function CustomerSegmentChart({ data }: CustomerSegmentChartProps) {
  const chartData = data.map((item) => {
    const displayName = item.segment.replace(/_/g, " ");
    return {
      name: displayName,
      value: item.count,
      totalValue: item.totalValue,
      originalSegment: item.segment,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Customer Segmentation</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => {
                const color = COLORS[entry.originalSegment] || COLORS[entry.name] || COLORS[entry.name.replace(/ /g, "_")] || "#8884d8";
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={color}
                  />
                );
              })}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                color: "#111827",
              }}
              formatter={(value: number, name: string, props: any) => {
                return [`${value} customers`, props.payload.name];
              }}
            />
            <Legend 
              wrapperStyle={{ color: "#374151" }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          {data.map((segment) => {
            const displayName = segment.segment.replace(/_/g, " ");
            const color = COLORS[segment.segment] || COLORS[displayName] || COLORS[displayName.replace(/ /g, "_")] || "#8884d8";
            return (
              <div
                key={segment.segment}
                className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-medium text-gray-900">
                    {displayName}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{segment.count} customers</div>
                  <div className="text-gray-600 text-xs">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "SLL",
                      minimumFractionDigits: 0,
                    }).format(segment.totalValue)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

