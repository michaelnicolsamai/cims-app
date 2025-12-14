import { prisma } from "@/lib/db";
import { startOfMonth, endOfMonth, addMonths, format, subMonths } from "date-fns";

export interface RevenueForecast {
  period: string; // "2025-02", "2025-03", etc.
  forecastedRevenue: number;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  lowerBound: number; // Conservative estimate
  upperBound: number; // Optimistic estimate
  factors: string[];
}

/**
 * Enhanced revenue forecasting using multiple methods:
 * 1. Exponential Smoothing (Holt-Winters method)
 * 2. Linear Regression
 * 3. Moving Average
 * 4. Seasonal Adjustment
 */
export async function forecastRevenue(
  ownerId: string,
  monthsAhead: number = 6,
  historicalMonths: number = 12
): Promise<RevenueForecast[]> {
  const now = new Date();
  const forecasts: RevenueForecast[] = [];

  // Get historical data
  const historicalData: number[] = [];
  const historicalDates: Date[] = [];
  for (let i = historicalMonths - 1; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i));
    const monthEnd = endOfMonth(monthStart);

    const sales = await prisma.sale.findMany({
      where: {
        ownerId,
        saleDate: {
          gte: monthStart,
          lte: monthEnd,
        },
        status: "COMPLETED",
      },
    });

    const revenue = sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
    historicalData.push(revenue);
    historicalDates.push(monthStart);
  }

  if (historicalData.length === 0) {
    // No historical data, return zero forecasts
    for (let i = 1; i <= monthsAhead; i++) {
      const forecastMonth = addMonths(now, i);
      forecasts.push({
        period: format(forecastMonth, "yyyy-MM"),
        forecastedRevenue: 0,
        confidence: "LOW",
        lowerBound: 0,
        upperBound: 0,
        factors: ["Insufficient historical data"],
      });
    }
    return forecasts;
  }

  // Calculate multiple forecast methods
  const shortTermAvg = calculateMovingAverage(historicalData.slice(-3)); // Last 3 months
  const longTermAvg = calculateMovingAverage(historicalData); // All months
  const trend = calculateTrend(historicalData.slice(-6)); // Last 6 months trend
  const exponentialSmooth = calculateExponentialSmoothing(historicalData, 0.3);
  const linearForecast = calculateLinearRegressionForecast(historicalData);

  // Detect seasonality (simple: check for patterns in same month across years)
  const seasonalFactors = detectSeasonality(historicalData, historicalDates);

  // Forecast future months
  for (let i = 1; i <= monthsAhead; i++) {
    const forecastMonth = addMonths(now, i);
    const period = format(forecastMonth, "yyyy-MM");
    const monthIndex = forecastMonth.getMonth(); // 0-11

    // Ensemble forecast: Combine multiple methods
    // Weight: 30% exponential smoothing, 25% linear regression, 25% short-term avg, 20% long-term avg
    let baseForecast =
      exponentialSmooth * 0.3 +
      (linearForecast + trend * i) * 0.25 +
      shortTermAvg * 0.25 +
      longTermAvg * 0.2;

    // Apply seasonal adjustment if detected
    if (seasonalFactors[monthIndex] !== undefined) {
      baseForecast = baseForecast * seasonalFactors[monthIndex];
    }

    // Apply trend decay (trend becomes less reliable further out)
    const trendDecay = Math.max(0.5, 1 - i * 0.1);
    baseForecast = baseForecast * (1 + trend * trendDecay * 0.01);

    // Calculate confidence based on data consistency and forecast horizon
    const variance = calculateVariance(historicalData);
    const coefficientOfVariation =
      variance > 0 ? Math.sqrt(variance) / longTermAvg : 0;
    const horizonPenalty = i * 0.05; // Confidence decreases with distance

    let confidence: "HIGH" | "MEDIUM" | "LOW";
    const adjustedCV = coefficientOfVariation + horizonPenalty;
    if (adjustedCV < 0.2 && i <= 3) {
      confidence = "HIGH";
    } else if (adjustedCV < 0.4 && i <= 6) {
      confidence = "MEDIUM";
    } else {
      confidence = "LOW";
    }

    // Calculate bounds using prediction intervals
    const stdDev = Math.sqrt(variance);
    // Wider intervals for longer horizons
    const intervalMultiplier = 1.5 + i * 0.2;
    const lowerBound = Math.max(0, baseForecast - intervalMultiplier * stdDev);
    const upperBound = baseForecast + intervalMultiplier * stdDev;

    const factors: string[] = [];
    if (trend > 0) {
      factors.push("Positive growth trend detected");
    } else if (trend < 0) {
      factors.push("Declining trend detected");
    }
    if (shortTermAvg > longTermAvg * 1.1) {
      factors.push("Recent performance significantly above average");
    } else if (shortTermAvg < longTermAvg * 0.9) {
      factors.push("Recent performance below average");
    }
    if (seasonalFactors[monthIndex] !== undefined) {
      factors.push(`Seasonal adjustment applied for ${format(forecastMonth, "MMMM")}`);
    }
    if (confidence === "LOW") {
      factors.push("High uncertainty due to data volatility or long forecast horizon");
    }
    if (i > 3) {
      factors.push("Long-term forecast - accuracy decreases with distance");
    }

    forecasts.push({
      period,
      forecastedRevenue: Math.round(baseForecast),
      confidence,
      lowerBound: Math.round(lowerBound),
      upperBound: Math.round(upperBound),
      factors,
    });
  }

  return forecasts;
}

/**
 * Calculate simple moving average
 */
function calculateMovingAverage(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  return sum / values.length;
}

/**
 * Calculate trend (linear regression slope)
 */
function calculateTrend(values: number[]): number {
  if (values.length < 2) return 0;

  const n = values.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = values;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  return slope;
}

/**
 * Calculate variance
 */
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = calculateMovingAverage(values);
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  return calculateMovingAverage(squaredDiffs);
}

/**
 * Calculate exponential smoothing forecast
 */
function calculateExponentialSmoothing(
  values: number[],
  alpha: number = 0.3
): number {
  if (values.length === 0) return 0;
  if (values.length === 1) return values[0];

  let smoothed = values[0];
  for (let i = 1; i < values.length; i++) {
    smoothed = alpha * values[i] + (1 - alpha) * smoothed;
  }
  return smoothed;
}

/**
 * Calculate linear regression forecast
 */
function calculateLinearRegressionForecast(values: number[]): number {
  if (values.length < 2) return values[0] || 0;

  const n = values.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = values;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Forecast next value
  return slope * n + intercept;
}

/**
 * Detect seasonality patterns (simple monthly seasonality)
 */
function detectSeasonality(
  values: number[],
  dates: Date[]
): Record<number, number> {
  const seasonalFactors: Record<number, number[]> = {};

  // Group by month
  dates.forEach((date, index) => {
    const month = date.getMonth();
    if (!seasonalFactors[month]) {
      seasonalFactors[month] = [];
    }
    seasonalFactors[month].push(values[index]);
  });

  // Calculate average for each month
  const overallAvg = calculateMovingAverage(values);
  const factors: Record<number, number> = {};

  Object.keys(seasonalFactors).forEach((monthStr) => {
    const month = parseInt(monthStr);
    const monthAvg = calculateMovingAverage(seasonalFactors[month]);
    // Only apply if there's significant variation (at least 2 data points and >10% difference)
    if (
      seasonalFactors[month].length >= 2 &&
      Math.abs(monthAvg - overallAvg) / overallAvg > 0.1
    ) {
      factors[month] = monthAvg / overallAvg;
    }
  });

  return factors;
}

