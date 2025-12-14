"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface CustomerInsightChartProps {
  data: Array<{
    name: string;
    value: number;
    label?: string;
  }>;
  title?: string;
  valueLabel?: string;
}

export function CustomerInsightChart({
  data,
  title = "Customer Insights",
  valueLabel = "Value",
}: CustomerInsightChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              angle={-45}
              textAnchor="end"
              height={100}
              stroke="#9ca3af"
            />
            <YAxis 
              tick={{ fontSize: 12, fill: "#6b7280" }}
              stroke="#9ca3af"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                color: "#111827",
              }}
              formatter={(value: number) => {
                if (typeof value === "number" && value > 1000) {
                  return `Le ${value.toLocaleString()}`;
                }
                return value;
              }}
            />
            <Legend 
              wrapperStyle={{ color: "#374151" }}
            />
            <Bar dataKey="value" fill="#3b82f6" name={valueLabel} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

