import { prisma } from "@/lib/db";
import { AnalyticsType } from "@prisma/client";
import { getTopCustomersInsights } from "./customer-insights.service";
import { getSalesTrends } from "./sales-analytics.service";
import { getHighChurnRiskCustomers } from "./churn-risk.service";
import { segmentCustomers } from "./customer-segmentation.service";
import { forecastRevenue } from "./revenue-forecast.service";
import { getBestSellingProducts } from "./sales-analytics.service";
import { getAverageCLV } from "./customer-lifetime-value.service";
import { getAllCustomersRFMAnalysis } from "./rfm-analysis.service";

export interface AutomatedInsight {
  type: AnalyticsType;
  title: string;
  summary: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  actionable: boolean;
  recommendations: string[];
  data: any;
  generatedAt: Date;
}

/**
 * Generate automated insights for a business
 */
export async function generateAutomatedInsights(
  ownerId: string
): Promise<AutomatedInsight[]> {
  const insights: AutomatedInsight[] = [];

  // 1. Top Customers Insight
  try {
    const topCustomers = await getTopCustomersInsights(ownerId, 10);
    if (topCustomers.length > 0) {
      const topCustomer = topCustomers[0];
      insights.push({
        type: AnalyticsType.TOP_CUSTOMERS,
        title: "Top Customer Performance",
        summary: `${topCustomer.customerName} is your top customer with ${new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "SLL",
          minimumFractionDigits: 0,
        }).format(topCustomer.totalSpent)} in total spending.`,
        priority: "HIGH",
        actionable: true,
        recommendations: [
          "Consider creating a VIP program for top customers",
          "Request testimonials from top customers",
          "Offer exclusive products or early access",
        ],
        data: topCustomers,
        generatedAt: new Date(),
      });
    }
  } catch (error) {
    console.error("Error generating top customers insight:", error);
  }

  // 2. Churn Risk Insight
  try {
    const churnCustomers = await getHighChurnRiskCustomers(ownerId, "MEDIUM");
    if (churnCustomers.length > 0) {
      const criticalChurn = churnCustomers.filter(
        (c) => c.analysis.riskLevel === "CRITICAL"
      );
      insights.push({
        type: AnalyticsType.CUSTOMER_CHURN_RISK,
        title: "Customer Churn Alert",
        summary: `${churnCustomers.length} customers are at risk of churning, including ${criticalChurn.length} with critical risk.`,
        priority: criticalChurn.length > 0 ? "HIGH" : "MEDIUM",
        actionable: true,
        recommendations: [
          "Immediately contact critical risk customers",
          "Launch win-back campaign with special offers",
          "Survey at-risk customers to understand concerns",
          "Review customer service quality",
        ],
        data: churnCustomers,
        generatedAt: new Date(),
      });
    }
  } catch (error) {
    console.error("Error generating churn risk insight:", error);
  }

  // 3. Sales Trend Insight
  try {
    const trends = await getSalesTrends(ownerId, 6);
    if (trends.length >= 2) {
      const recentTrend = trends[trends.length - 1];
      const previousTrend = trends[trends.length - 2];
      const growthRate = recentTrend.growthRate || 0;

      if (growthRate < -10) {
        insights.push({
          type: AnalyticsType.SALES_TREND_MONTHLY,
          title: "Sales Decline Detected",
          summary: `Sales have declined by ${Math.abs(growthRate).toFixed(1)}% compared to the previous period.`,
          priority: "HIGH",
          actionable: true,
          recommendations: [
            "Analyze reasons for sales decline",
            "Review marketing campaigns effectiveness",
            "Consider promotional offers to boost sales",
            "Check for seasonal factors",
          ],
          data: trends,
          generatedAt: new Date(),
        });
      } else if (growthRate > 10) {
        insights.push({
          type: AnalyticsType.SALES_TREND_MONTHLY,
          title: "Strong Sales Growth",
          summary: `Sales have grown by ${growthRate.toFixed(1)}% compared to the previous period.`,
          priority: "MEDIUM",
          actionable: true,
          recommendations: [
            "Capitalize on growth momentum",
            "Increase inventory for high-demand products",
            "Scale successful marketing strategies",
            "Consider expanding product lines",
          ],
          data: trends,
          generatedAt: new Date(),
        });
      }
    }
  } catch (error) {
    console.error("Error generating sales trend insight:", error);
  }

  // 4. Revenue Forecast Insight
  try {
    const forecast = await forecastRevenue(ownerId, 3, 12);
    if (forecast.length > 0) {
      const nextMonth = forecast[0];
      const avgHistorical = forecast.reduce(
        (sum, f) => sum + f.forecastedRevenue,
        0
      ) / forecast.length;

      if (nextMonth.forecastedRevenue < avgHistorical * 0.8) {
        insights.push({
          type: AnalyticsType.REVENUE_FORECAST,
          title: "Revenue Forecast Warning",
          summary: `Forecasted revenue for next month is ${((1 - nextMonth.forecastedRevenue / avgHistorical) * 100).toFixed(1)}% below average.`,
          priority: "HIGH",
          actionable: true,
          recommendations: [
            "Implement revenue-boosting strategies",
            "Launch promotional campaigns",
            "Focus on high-value customer segments",
            "Review pricing strategy",
          ],
          data: forecast,
          generatedAt: new Date(),
        });
      }
    }
  } catch (error) {
    console.error("Error generating revenue forecast insight:", error);
  }

  // 5. Customer Segmentation Insight
  try {
    const segments = await segmentCustomers(ownerId);
    const atRiskSegment = segments.find((s) => s.segment === "AT_RISK");
    const inactiveSegment = segments.find((s) => s.segment === "INACTIVE");

    if (atRiskSegment && atRiskSegment.count > 0) {
      insights.push({
        type: AnalyticsType.CUSTOMER_ACQUISITION,
        title: "Customer Segment Analysis",
        summary: `${atRiskSegment.count} customers are in the AT_RISK segment, representing ${new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "SLL",
          minimumFractionDigits: 0,
        }).format(atRiskSegment.totalValue)} in potential lost revenue.`,
        priority: "HIGH",
        actionable: true,
        recommendations: [
          "Launch targeted retention campaigns",
          "Offer personalized discounts to at-risk customers",
          "Improve customer engagement strategies",
        ],
        data: segments,
        generatedAt: new Date(),
      });
    }

    if (inactiveSegment && inactiveSegment.count > 0) {
      insights.push({
        type: AnalyticsType.CUSTOMER_ACQUISITION,
        title: "Inactive Customers Detected",
        summary: `${inactiveSegment.count} customers have been inactive for 6+ months.`,
        priority: "MEDIUM",
        actionable: true,
        recommendations: [
          "Launch reactivation campaigns",
          "Survey inactive customers for feedback",
          'Offer "new customer" deals to win them back',
        ],
        data: segments,
        generatedAt: new Date(),
      });
    }
  } catch (error) {
    console.error("Error generating segmentation insight:", error);
  }

  // 6. Best Selling Products Insight
  try {
    const bestProducts = await getBestSellingProducts(ownerId, 5);
    if (bestProducts.length > 0) {
      const topProduct = bestProducts[0];
      insights.push({
        type: AnalyticsType.BEST_SELLING_PRODUCTS,
        title: "Product Performance",
        summary: `${topProduct.productName} is your best-selling product with ${topProduct.totalQuantity} units sold.`,
        priority: "MEDIUM",
        actionable: true,
        recommendations: [
          "Ensure adequate inventory for top products",
          "Consider bundling best sellers with slower products",
          "Use best sellers in marketing campaigns",
          "Analyze why these products are successful",
        ],
        data: bestProducts,
        generatedAt: new Date(),
      });
    }
  } catch (error) {
    console.error("Error generating best products insight:", error);
  }

  // 7. Customer Lifetime Value Insight
  try {
    const clvStats = await getAverageCLV(ownerId);
    if (clvStats.averageCLV > 0) {
      insights.push({
        type: AnalyticsType.CUSTOMER_ACQUISITION,
        title: "Customer Value Analysis",
        summary: `Average customer lifetime value is ${new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "SLL",
          minimumFractionDigits: 0,
        }).format(clvStats.averageCLV)}. You have ${clvStats.highValueCustomers} high-value customers.`,
        priority: "MEDIUM",
        actionable: true,
        recommendations: [
          "Focus retention efforts on high-value customers",
          "Develop strategies to increase average CLV",
          "Create tiered loyalty programs",
        ],
        data: clvStats,
        generatedAt: new Date(),
      });
    }
  } catch (error) {
    console.error("Error generating CLV insight:", error);
  }

  // 8. RFM Analysis Insight
  try {
    const rfmAnalysis = await getAllCustomersRFMAnalysis(ownerId);
    const lostCustomers = rfmAnalysis.filter(
      (a) => a.rfmScore.segment === "Lost"
    );
    const champions = rfmAnalysis.filter(
      (a) => a.rfmScore.segment === "Champions"
    );

    if (lostCustomers.length > 0) {
      insights.push({
        type: AnalyticsType.CUSTOMER_CHURN_RISK,
        title: "Lost Customers Identified",
        summary: `RFM analysis identified ${lostCustomers.length} customers in the "Lost" segment.`,
        priority: "MEDIUM",
        actionable: true,
        recommendations: [
          "Launch aggressive win-back campaigns",
          "Survey to understand why they left",
          "Consider removing from active marketing to save costs",
        ],
        data: { lostCustomers, total: rfmAnalysis.length },
        generatedAt: new Date(),
      });
    }

    if (champions.length > 0) {
      insights.push({
        type: AnalyticsType.TOP_CUSTOMERS,
        title: "Champion Customers",
        summary: `You have ${champions.length} "Champion" customers (high recency, frequency, and monetary value).`,
        priority: "HIGH",
        actionable: true,
        recommendations: [
          "Create exclusive VIP program for champions",
          "Request referrals and testimonials",
          "Offer early access to new products",
        ],
        data: { champions, total: rfmAnalysis.length },
        generatedAt: new Date(),
      });
    }
  } catch (error) {
    console.error("Error generating RFM insight:", error);
  }

  // Sort insights by priority
  const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  insights.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  return insights;
}

/**
 * Save generated insights to database
 */
export async function saveAutomatedInsights(
  ownerId: string,
  insights: AutomatedInsight[]
): Promise<void> {
  for (const insight of insights) {
    await prisma.analyticsLog.create({
      data: {
        ownerId,
        type: insight.type,
        title: insight.title,
        summary: insight.summary,
        data: insight.data as any,
        generatedAt: insight.generatedAt,
      },
    });
  }
}

/**
 * Generate and save insights
 */
export async function generateAndSaveInsights(
  ownerId: string
): Promise<AutomatedInsight[]> {
  const insights = await generateAutomatedInsights(ownerId);
  await saveAutomatedInsights(ownerId, insights);
  return insights;
}

