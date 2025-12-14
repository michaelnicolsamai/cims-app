"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface SalesTrendData {
  period: string;
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  numberOfOrders: number;
  growthRate: number | null;
}

interface SalesTrendChartProps {
  data: SalesTrendData[];
}

export function SalesTrendChart({ data }: SalesTrendChartProps) {
  const chartData = data.map((item) => ({
    period: item.period,
    revenue: item.totalRevenue,
    orders: item.numberOfOrders,
    avgOrder: item.averageOrderValue,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Sales Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              angle={-45}
              textAnchor="end"
              height={80}
              stroke="#9ca3af"
            />
            <YAxis 
              yAxisId="left" 
              tick={{ fontSize: 12, fill: "#6b7280" }}
              stroke="#9ca3af"
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
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
              formatter={(value: number, name: string) => {
                if (name === "revenue" || name === "avgOrder") {
                  return `Le ${value.toLocaleString()}`;
                }
                return value;
              }}
            />
            <Legend 
              wrapperStyle={{ color: "#374151" }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Revenue (SLL)"
              dot={{ fill: "#3b82f6", r: 4 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="orders"
              stroke="#10b981"
              strokeWidth={2}
              name="Number of Orders"
              dot={{ fill: "#10b981", r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

