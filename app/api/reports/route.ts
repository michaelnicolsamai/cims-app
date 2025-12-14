import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { startOfDay, endOfDay, subDays, subMonths, subYears } from "date-fns";
import { getSalesTrends } from "@/lib/services/analytics/sales-analytics.service";
import { segmentCustomers } from "@/lib/services/analytics/customer-segmentation.service";
import { getBestSellingProducts } from "@/lib/services/analytics/sales-analytics.service";
import { getPaymentMethodAnalysis } from "@/lib/services/analytics/sales-analytics.service";
import { getRegionalSales } from "@/lib/services/analytics/sales-analytics.service";

export type ReportType =
  | "sales_summary"
  | "sales_detailed"
  | "customer_analysis"
  | "product_performance"
  | "financial_summary"
  | "payment_analysis"
  | "regional_sales";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const reportType = searchParams.get("type") as ReportType;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!reportType) {
      return NextResponse.json(
        { error: "Report type is required" },
        { status: 400 }
      );
    }

    const dateStart = startDate
      ? startOfDay(new Date(startDate))
      : startOfDay(subMonths(new Date(), 1));
    const dateEnd = endDate
      ? endOfDay(new Date(endDate))
      : endOfDay(new Date());

    let reportData: any = {};

    switch (reportType) {
      case "sales_summary":
        reportData = await generateSalesSummaryReport(
          user.id,
          dateStart,
          dateEnd
        );
        break;

      case "sales_detailed":
        reportData = await generateSalesDetailedReport(
          user.id,
          dateStart,
          dateEnd
        );
        break;

      case "customer_analysis":
        reportData = await generateCustomerAnalysisReport(
          user.id,
          dateStart,
          dateEnd
        );
        break;

      case "product_performance":
        reportData = await generateProductPerformanceReport(
          user.id,
          dateStart,
          dateEnd
        );
        break;

      case "financial_summary":
        reportData = await generateFinancialSummaryReport(
          user.id,
          dateStart,
          dateEnd
        );
        break;

      case "payment_analysis":
        reportData = await generatePaymentAnalysisReport(
          user.id,
          dateStart,
          dateEnd
        );
        break;

      case "regional_sales":
        reportData = await generateRegionalSalesReport(
          user.id,
          dateStart,
          dateEnd
        );
        break;

      default:
        return NextResponse.json(
          { error: "Invalid report type" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      reportType,
      dateRange: {
        start: dateStart.toISOString(),
        end: dateEnd.toISOString(),
      },
      data: reportData,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate report" },
      { status: 500 }
    );
  }
}

// Sales Summary Report
async function generateSalesSummaryReport(
  ownerId: string,
  startDate: Date,
  endDate: Date
) {
  const sales = await prisma.sale.findMany({
    where: {
      ownerId,
      saleDate: { gte: startDate, lte: endDate },
      status: "COMPLETED",
    },
    include: {
      customer: {
        select: { name: true },
      },
    },
  });

  const totalRevenue = sales.reduce(
    (sum, s) => sum + Number(s.totalAmount),
    0
  );
  const totalSales = sales.length;
  const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
  const totalDiscounts = sales.reduce(
    (sum, s) => sum + Number(s.discount),
    0
  );
  const totalTax = sales.reduce((sum, s) => sum + Number(s.tax), 0);

  // Daily breakdown
  const dailyBreakdown: Record<string, { revenue: number; count: number }> =
    {};
  sales.forEach((sale) => {
    const date = sale.saleDate.toISOString().split("T")[0];
    if (!dailyBreakdown[date]) {
      dailyBreakdown[date] = { revenue: 0, count: 0 };
    }
    dailyBreakdown[date].revenue += Number(sale.totalAmount);
    dailyBreakdown[date].count += 1;
  });

  return {
    summary: {
      totalRevenue,
      totalSales,
      averageOrderValue,
      totalDiscounts,
      totalTax,
      period: { start: startDate, end: endDate },
    },
    dailyBreakdown: Object.entries(dailyBreakdown).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      count: data.count,
    })),
  };
}

// Sales Detailed Report
async function generateSalesDetailedReport(
  ownerId: string,
  startDate: Date,
  endDate: Date
) {
  const sales = await prisma.sale.findMany({
    where: {
      ownerId,
      saleDate: { gte: startDate, lte: endDate },
    },
    include: {
      customer: {
        select: { name: true, phone: true },
      },
      items: {
        include: {
          product: {
            select: { name: true, sku: true },
          },
        },
      },
      saleRegion: {
        select: { name: true },
      },
    },
    orderBy: { saleDate: "desc" },
  });

  return {
    sales: sales.map((sale) => ({
      invoiceNumber: sale.invoiceNumber,
      date: sale.saleDate,
      customer: sale.customer?.name || "Walk-in",
      customerPhone: sale.customer?.phone,
      region: sale.saleRegion?.name,
      items: sale.items.map((item) => ({
        product: item.productName,
        sku: item.product?.sku,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
      subtotal: Number(sale.subtotal),
      discount: Number(sale.discount),
      tax: Number(sale.tax),
      totalAmount: Number(sale.totalAmount),
      paymentMethod: sale.paymentMethod,
      paymentStatus: sale.paymentStatus,
      status: sale.status,
    })),
  };
}

// Customer Analysis Report
async function generateCustomerAnalysisReport(
  ownerId: string,
  startDate: Date,
  endDate: Date
) {
  const segments = await segmentCustomers(ownerId);
  const customers = await prisma.customer.findMany({
    where: { ownerId },
    include: {
      sales: {
        where: {
          saleDate: { gte: startDate, lte: endDate },
          status: "COMPLETED",
        },
      },
    },
  });

  const customerStats = customers.map((customer) => {
    const periodSales = customer.sales;
    const periodRevenue = periodSales.reduce(
      (sum, s) => sum + Number(s.totalAmount),
      0
    );
    const segment = segments.find((s) =>
      s.customers.some((c) => c.id === customer.id)
    );

    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      segment: segment?.segment || "REGULAR",
      totalSpent: Number(customer.totalSpent),
      periodRevenue,
      periodVisits: periodSales.length,
      loyaltyScore: customer.loyaltyScore,
      lastVisit: customer.lastVisit,
    };
  });

  return {
    segments: segments.map((s) => ({
      segment: s.segment,
      count: s.count,
      totalValue: s.totalValue,
      averageValue: s.averageValue,
    })),
    customers: customerStats.sort((a, b) => b.periodRevenue - a.periodRevenue),
  };
}

// Product Performance Report
async function generateProductPerformanceReport(
  ownerId: string,
  startDate: Date,
  endDate: Date
) {
  const products = await getBestSellingProducts(ownerId, 100, startDate, endDate);
  const allProducts = await prisma.product.findMany({
    where: { ownerId },
    select: {
      id: true,
      name: true,
      sku: true,
      category: true,
      currentStock: true,
      sellingPrice: true,
      costPrice: true,
    },
  });

  // Merge with product details
  const productPerformance = products.map((product) => {
    const productDetails = allProducts.find(
      (p) => p.id === product.productId || p.name === product.productName
    );

    const profitMargin =
      productDetails && Number(productDetails.costPrice) > 0
        ? ((Number(productDetails.sellingPrice) -
            Number(productDetails.costPrice)) /
            Number(productDetails.costPrice)) *
          100
        : 0;

    return {
      ...product,
      category: productDetails?.category,
      currentStock: productDetails?.currentStock || 0,
      profitMargin,
    };
  });

  return {
    products: productPerformance,
    summary: {
      totalProducts: productPerformance.length,
      totalQuantitySold: productPerformance.reduce(
        (sum, p) => sum + p.totalQuantity,
        0
      ),
      totalRevenue: productPerformance.reduce(
        (sum, p) => sum + p.totalRevenue,
        0
      ),
    },
  };
}

// Financial Summary Report
async function generateFinancialSummaryReport(
  ownerId: string,
  startDate: Date,
  endDate: Date
) {
  const sales = await prisma.sale.findMany({
    where: {
      ownerId,
      saleDate: { gte: startDate, lte: endDate },
      status: "COMPLETED",
    },
  });

  const totalRevenue = sales.reduce(
    (sum, s) => sum + Number(s.totalAmount),
    0
  );
  const totalPaid = sales.reduce((sum, s) => sum + Number(s.amountPaid), 0);
  const totalPending = sales.reduce(
    (sum, s) => sum + Number(s.balanceDue),
    0
  );
  const totalDiscounts = sales.reduce(
    (sum, s) => sum + Number(s.discount),
    0
  );
  const totalTax = sales.reduce((sum, s) => sum + Number(s.tax), 0);

  // Payment status breakdown
  const paymentStatusBreakdown = sales.reduce(
    (acc, sale) => {
      const status = sale.paymentStatus;
      if (!acc[status]) {
        acc[status] = { count: 0, amount: 0 };
      }
      acc[status].count += 1;
      acc[status].amount += Number(sale.totalAmount);
      return acc;
    },
    {} as Record<string, { count: number; amount: number }>
  );

  return {
    summary: {
      totalRevenue,
      totalPaid,
      totalPending,
      totalDiscounts,
      totalTax,
      netRevenue: totalRevenue - totalDiscounts,
    },
    paymentStatusBreakdown: Object.entries(paymentStatusBreakdown).map(
      ([status, data]) => ({
        status,
        count: data.count,
        amount: data.amount,
      })
    ),
  };
}

// Payment Analysis Report
async function generatePaymentAnalysisReport(
  ownerId: string,
  startDate: Date,
  endDate: Date
) {
  const paymentMethods = await getPaymentMethodAnalysis(
    ownerId,
    startDate,
    endDate
  );

  const sales = await prisma.sale.findMany({
    where: {
      ownerId,
      saleDate: { gte: startDate, lte: endDate },
      status: "COMPLETED",
    },
  });

  // Payment status analysis
  const paymentStatusAnalysis = sales.reduce(
    (acc, sale) => {
      const status = sale.paymentStatus;
      if (!acc[status]) {
        acc[status] = { count: 0, amount: 0, average: 0 };
      }
      acc[status].count += 1;
      acc[status].amount += Number(sale.totalAmount);
      return acc;
    },
    {} as Record<
      string,
      { count: number; amount: number; average: number }
    >
  );

  Object.keys(paymentStatusAnalysis).forEach((status) => {
    const data = paymentStatusAnalysis[status];
    data.average = data.count > 0 ? data.amount / data.count : 0;
  });

  return {
    paymentMethods,
    paymentStatusAnalysis: Object.entries(paymentStatusAnalysis).map(
      ([status, data]) => ({
        status,
        ...data,
      })
    ),
  };
}

// Regional Sales Report
async function generateRegionalSalesReport(
  ownerId: string,
  startDate: Date,
  endDate: Date
) {
  const regionalSales = await getRegionalSales(ownerId, startDate, endDate);

  return {
    regions: regionalSales,
    summary: {
      totalRegions: regionalSales.length,
      totalRevenue: regionalSales.reduce((sum, r) => sum + r.totalRevenue, 0),
      totalSales: regionalSales.reduce((sum, r) => sum + r.totalSales, 0),
    },
  };
}

