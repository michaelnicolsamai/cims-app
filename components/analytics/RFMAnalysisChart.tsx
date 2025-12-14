"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

interface RFMData {
  segment: string;
  count: number;
}

interface RFMAnalysisChartProps {
  data: RFMData[];
}

const COLORS = {
  Champions: "#10b981",
  "Loyal Customers": "#3b82f6",
  "Potential Loyalists": "#8b5cf6",
  "New Customers": "#f59e0b",
  Promising: "#ec4899",
  "Need Attention": "#f97316",
  "About to Sleep": "#ef4444",
  "At Risk": "#dc2626",
  "Cannot Lose Them": "#991b1b",
  Hibernating: "#6b7280",
  Lost: "#374151",
  Regular: "#9ca3af",
};

export function RFMAnalysisChart({ data }: RFMAnalysisChartProps) {
  const chartData = data.map((item) => ({
    name: item.segment,
    count: item.count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-gray-900">RFM Customer Segments</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={120}
              tick={{ fill: "#6b7280", fontSize: 12 }}
            />
            <YAxis tick={{ fill: "#6b7280" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                color: "#111827",
              }}
            />
            <Legend />
            <Bar dataKey="count" name="Number of Customers" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    COLORS[entry.name as keyof typeof COLORS] || "#9ca3af"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

