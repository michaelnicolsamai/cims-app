import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { AnalyticsType } from "@prisma/client";
import { getTopCustomersInsights } from "@/lib/services/analytics/customer-insights.service";
import { getSalesTrends } from "@/lib/services/analytics/sales-analytics.service";
import { getHighChurnRiskCustomers } from "@/lib/services/analytics/churn-risk.service";
import { segmentCustomers } from "@/lib/services/analytics/customer-segmentation.service";
import { forecastRevenue } from "@/lib/services/analytics/revenue-forecast.service";
import { getPaymentMethodAnalysis, getRegionalSales, getBestSellingProducts } from "@/lib/services/analytics/sales-analytics.service";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { type, period } = body;

    if (!type || !Object.values(AnalyticsType).includes(type)) {
      return NextResponse.json(
        { error: "Invalid analytics type" },
        { status: 400 }
      );
    }

    let data: any;
    let title: string;
    let summary: string;

    switch (type) {
      case AnalyticsType.TOP_CUSTOMERS:
        const topCustomers = await getTopCustomersInsights(user.id, 10);
        data = topCustomers;
        title = "Top Customers";
        summary = `Identified ${topCustomers.length} top customers by revenue`;
        break;

      case AnalyticsType.SALES_TREND_MONTHLY:
        const trends = await getSalesTrends(user.id, 12);
        data = trends;
        title = "Monthly Sales Trends";
        summary = `Analyzed sales trends over ${trends.length} months`;
        break;

      case AnalyticsType.CUSTOMER_CHURN_RISK:
        const churnCustomers = await getHighChurnRiskCustomers(user.id, "MEDIUM");
        data = churnCustomers;
        title = "Customer Churn Risk Analysis";
        summary = `Identified ${churnCustomers.length} customers at risk of churning`;
        break;

      case AnalyticsType.REVENUE_FORECAST:
        const forecast = await forecastRevenue(user.id, 6, 12);
        data = forecast;
        title = "Revenue Forecast";
        summary = `Forecasted revenue for next ${forecast.length} months`;
        break;

      case AnalyticsType.BEST_SELLING_PRODUCTS:
        const products = await getBestSellingProducts(user.id, 10);
        data = products;
        title = "Best Selling Products";
        summary = `Top ${products.length} products by sales volume`;
        break;

      case AnalyticsType.RETURNING_CUSTOMERS:
        const segments = await segmentCustomers(user.id);
        const returning = segments.find((s) => s.segment === "LOYAL" || s.segment === "VIP");
        data = returning || { segment: "RETURNING", count: 0, customers: [] };
        title = "Returning Customers";
        summary = `Identified ${returning?.count || 0} loyal and VIP customers`;
        break;

      case AnalyticsType.PAYMENT_METHODS_ANALYSIS:
        const paymentMethods = await getPaymentMethodAnalysis(user.id);
        data = paymentMethods;
        title = "Payment Methods Analysis";
        summary = `Analyzed ${paymentMethods.length} payment methods`;
        break;

      case AnalyticsType.REGIONAL_SALES:
        const regional = await getRegionalSales(user.id);
        data = regional;
        title = "Regional Sales Analysis";
        summary = `Sales analysis across ${regional.length} regions`;
        break;

      case AnalyticsType.CUSTOMER_ACQUISITION:
        const allSegments = await segmentCustomers(user.id);
        const newCustomers = allSegments.find((s) => s.segment === "NEW");
        data = newCustomers || { segment: "NEW", count: 0, customers: [] };
        title = "Customer Acquisition";
        summary = `${newCustomers?.count || 0} new customers acquired`;
        break;

      case AnalyticsType.INVENTORY_ALERTS:
        const lowStockProducts = await prisma.product.findMany({
          where: {
            ownerId: user.id,
            currentStock: {
              lte: prisma.product.fields.lowStockAlert,
            },
          },
        });
        data = lowStockProducts;
        title = "Inventory Alerts";
        summary = `${lowStockProducts.length} products below stock threshold`;
        break;

      default:
        return NextResponse.json(
          { error: "Analytics type not implemented" },
          { status: 400 }
        );
    }

    // Save to analytics log
    const log = await prisma.analyticsLog.create({
      data: {
        type: type as AnalyticsType,
        period: period || new Date().toISOString().slice(0, 7), // YYYY-MM
        title,
        summary,
        data: data as any,
        ownerId: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        logId: log.id,
        type: log.type,
        title: log.title,
        summary: log.summary,
        data: log.data,
        generatedAt: log.generatedAt,
      },
    });
  } catch (error: any) {
    console.error("Error generating analytics:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate analytics" },
      { status: 500 }
    );
  }
}

