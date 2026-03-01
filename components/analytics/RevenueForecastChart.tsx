"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
  ReferenceLine,
} from "recharts";

interface RevenueForecast {
  period: string;
  forecastedRevenue: number;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  lowerBound: number;
  upperBound: number;
  factors: string[];
}

interface HistoricalRevenue {
  period: string;
  actualRevenue: number;
  type?: "historical";
}

interface RevenueForecastChartProps {
  /** Forecast data (predicted future values) */
  data: RevenueForecast[];
  /** Optional: historical actual revenue for combined trend visualization */
  historical?: HistoricalRevenue[];
  /** Optional: description for budgeting/inventory/seasonal planning */
  showInfoBanner?: boolean;
}

export function RevenueForecastChart({
  data,
  historical = [],
  showInfoBanner = false,
}: RevenueForecastChartProps) {
  // Build combined chart data: historical first, then forecast
  const historicalMap = new Map(
    historical.map((h) => [h.period, { actual: h.actualRevenue }])
  );
  const forecastMap = new Map(
    data.map((f) => [
      f.period,
      {
        forecast: f.forecastedRevenue,
        lower: f.lowerBound,
        upper: f.upperBound,
        confidence: f.confidence,
      },
    ])
  );

  const allPeriods = [
    ...historical.map((h) => h.period),
    ...data.map((f) => f.period).filter((p) => !historicalMap.has(p)),
  ];
  const uniquePeriods = Array.from(new Set(allPeriods)).sort();

  const chartData = uniquePeriods.map((period) => {
    const h = historicalMap.get(period);
    const f = forecastMap.get(period);
    const lower = f?.lower ?? null;
    const upper = f?.upper ?? null;
    const band =
      lower != null && upper != null ? Math.max(0, upper - lower) : null;
    return {
      period,
      actual: h?.actual ?? null,
      forecast: f?.forecast ?? null,
      lower,
      upper,
      band,
      confidence: f?.confidence ?? null,
    };
  });

  const hasHistorical = historical.length > 0;
  const lastHistoricalPeriod = hasHistorical ? historical[historical.length - 1].period : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Revenue Forecast Visualization
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Historical performance and predicted revenue for short-term planning
        </p>
      </CardHeader>
      <CardContent>
        {showInfoBanner && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Budgeting & Planning:</strong> Forecast results are presented as trend
              visualizations combining historical performance and predicted revenue values for
              short-term planning. This supports budgeting, inventory preparation, and seasonal
              decision-making.
            </p>
          </div>
        )}

        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
              tickFormatter={(v) => `Le ${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                color: "#111827",
              }}
              formatter={(value: number, name: string) => [
                value != null ? `Le ${value.toLocaleString()}` : "—",
                name === "actual" ? "Actual Revenue" : name === "forecast" ? "Predicted" : name,
              ]}
              labelFormatter={(label) => `Period: ${label}`}
            />
            <Legend wrapperStyle={{ color: "#374151" }} />

            {/* Vertical reference line between historical and forecast */}
            {hasHistorical && lastHistoricalPeriod && (
              <ReferenceLine
                x={lastHistoricalPeriod}
                stroke="#94a3b8"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
            )}
            {/* Confidence band: lower + band (upper-lower) stacked creates band between lower and upper */}
            {chartData.some((d) => d.band != null) && (
              <>
                <Area
                  type="monotone"
                  dataKey="lower"
                  stackId="band"
                  stroke="none"
                  fill="transparent"
                  fillOpacity={0}
                  connectNulls={false}
                  hide
                />
                <Area
                  type="monotone"
                  dataKey="band"
                  stackId="band"
                  stroke="#93c5fd"
                  fill="#3b82f6"
                  fillOpacity={0.2}
                  name="Confidence Range"
                  connectNulls={false}
                />
              </>
            )}
            {/* Historical actual revenue */}
            {hasHistorical && (
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#2563eb"
                strokeWidth={2.5}
                name="Actual Revenue"
                dot={{ fill: "#2563eb", r: 3 }}
                connectNulls={false}
              />
            )}
            {/* Predicted revenue */}
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#f59e0b"
              strokeWidth={2.5}
              strokeDasharray="5 5"
              name="Predicted Revenue"
              dot={{ fill: "#f59e0b", r: 3 }}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>

        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            Forecast breakdown
          </p>
          {data.map((f) => (
            <div
              key={f.period}
              className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded"
            >
              <div>
                <div className="font-medium text-gray-900">{f.period}</div>
                <div className="text-xs text-gray-600">Confidence: {f.confidence}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  Le {f.forecastedRevenue.toLocaleString()}
                </div>
                <div className="text-xs text-gray-600">
                  Le {f.lowerBound.toLocaleString()} – Le {f.upperBound.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
