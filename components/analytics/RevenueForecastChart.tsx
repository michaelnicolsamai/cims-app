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
  Area,
  AreaChart,
} from "recharts";

interface RevenueForecast {
  period: string;
  forecastedRevenue: number;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  lowerBound: number;
  upperBound: number;
  factors: string[];
}

interface RevenueForecastChartProps {
  data: RevenueForecast[];
}

export function RevenueForecastChart({ data }: RevenueForecastChartProps) {
  const chartData = data.map((item) => ({
    period: item.period,
    forecast: item.forecastedRevenue,
    lower: item.lowerBound,
    upper: item.upperBound,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Revenue Forecast</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
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
              formatter={(value: number) => `Le ${value.toLocaleString()}`}
            />
            <Legend 
              wrapperStyle={{ color: "#374151" }}
            />
            <Area
              type="monotone"
              dataKey="upper"
              stackId="1"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.2}
              name="Upper Bound"
            />
            <Area
              type="monotone"
              dataKey="lower"
              stackId="1"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.2}
              name="Lower Bound"
            />
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#f59e0b"
              strokeWidth={3}
              name="Forecast"
              dot={{ fill: "#f59e0b", r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          {data.map((forecast) => (
            <div
              key={forecast.period}
              className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded"
            >
              <div>
                <div className="font-medium text-gray-900">{forecast.period}</div>
                <div className="text-xs text-gray-600">
                  Confidence: {forecast.confidence}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  Le {forecast.forecastedRevenue.toLocaleString()}
                </div>
                <div className="text-xs text-gray-600">
                  Le {forecast.lowerBound.toLocaleString()} - Le{" "}
                  {forecast.upperBound.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

