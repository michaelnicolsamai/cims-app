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

interface CLVData {
  customerName: string;
  clv: number;
  predictedFutureValue: number;
}

interface CLVChartProps {
  data: CLVData[];
  limit?: number;
}

export function CLVChart({ data, limit = 10 }: CLVChartProps) {
  const chartData = data
    .sort((a, b) => b.clv - a.clv)
    .slice(0, limit)
    .map((item) => ({
      name: item.customerName.length > 15
        ? item.customerName.substring(0, 15) + "..."
        : item.customerName,
      "Lifetime Value": item.clv,
      "Next 12 Months": item.predictedFutureValue,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-gray-900">Customer Lifetime Value (Top {limit})</CardTitle>
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
            <YAxis
              tick={{ fill: "#6b7280" }}
              tickFormatter={(value) =>
                new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "SLL",
                  notation: "compact",
                  minimumFractionDigits: 0,
                }).format(value)
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                color: "#111827",
              }}
              formatter={(value: number) =>
                new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "SLL",
                  minimumFractionDigits: 0,
                }).format(value)
              }
            />
            <Legend />
            <Bar
              dataKey="Lifetime Value"
              fill="#3b82f6"
              radius={[8, 8, 0, 0]}
            />
            <Bar
              dataKey="Next 12 Months"
              fill="#10b981"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

