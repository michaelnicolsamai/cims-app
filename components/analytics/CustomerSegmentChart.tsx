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

const COLORS = {
  VIP: "#8884d8",
  LOYAL: "#82ca9d",
  REGULAR: "#ffc658",
  NEW: "#ff7c7c",
  AT_RISK: "#ff8042",
  INACTIVE: "#8dd1e1",
};

export function CustomerSegmentChart({ data }: CustomerSegmentChartProps) {
  const chartData = data.map((item) => ({
    name: item.segment.replace("_", " "),
    value: item.count,
    totalValue: item.totalValue,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Customer Segmentation</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
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
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[entry.name as keyof typeof COLORS] || "#8884d8"}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                color: "#111827",
              }}
            />
            <Legend 
              wrapperStyle={{ color: "#374151" }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          {data.map((segment) => (
            <div
              key={segment.segment}
              className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{
                    backgroundColor:
                      COLORS[segment.segment as keyof typeof COLORS] || "#8884d8",
                  }}
                />
                <span className="font-medium text-gray-900">
                  {segment.segment.replace("_", " ")}
                </span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">{segment.count} customers</div>
                <div className="text-gray-600 text-xs">
                  Le {segment.totalValue.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

