import { prisma } from "@/lib/db";
import { startOfMonth, endOfMonth, subMonths, format, parseISO } from "date-fns";

export interface SalesTrendData {
  period: string; // "2025-01", "2025-02", etc.
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  numberOfOrders: number;
  growthRate: number | null; // Percentage change from previous period
}

export interface PaymentMethodAnalysis {
  method: string;
  count: number;
  totalAmount: number;
  percentage: number;
}

export interface RegionalSalesData {
  regionId: string;
  regionName: string;
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
}

/**
 * Get monthly sales trends
 */
export async function getSalesTrends(
  ownerId: string,
  months: number = 12
): Promise<SalesTrendData[]> {
  const now = new Date();
  const trends: SalesTrendData[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i));
    const monthEnd = endOfMonth(monthStart);
    const period = format(monthStart, "yyyy-MM");

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

    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
    const numberOfOrders = sales.length;
    const averageOrderValue = numberOfOrders > 0 ? totalRevenue / numberOfOrders : 0;

    // Calculate growth rate
    let growthRate: number | null = null;
    if (i < months - 1) {
      const previousPeriod = trends[trends.length - 1];
      if (previousPeriod.totalRevenue > 0) {
        growthRate = ((totalRevenue - previousPeriod.totalRevenue) / previousPeriod.totalRevenue) * 100;
      }
    }

    trends.push({
      period,
      totalSales: numberOfOrders,
      totalRevenue,
      averageOrderValue,
      numberOfOrders,
      growthRate,
    });
  }

  return trends;
}

/**
 * Analyze payment methods
 */
export async function getPaymentMethodAnalysis(
  ownerId: string,
  startDate?: Date,
  endDate?: Date
): Promise<PaymentMethodAnalysis[]> {
  const where: any = {
    ownerId,
    status: "COMPLETED",
  };

  if (startDate || endDate) {
    where.saleDate = {};
    if (startDate) where.saleDate.gte = startDate;
    if (endDate) where.saleDate.lte = endDate;
  }

  const sales = await prisma.sale.findMany({
    where,
  });

  const methodStats: Record<string, { count: number; totalAmount: number }> = {};

  sales.forEach((sale) => {
    const method = sale.paymentMethod;
    if (!methodStats[method]) {
      methodStats[method] = { count: 0, totalAmount: 0 };
    }
    methodStats[method].count++;
    methodStats[method].totalAmount += Number(sale.totalAmount);
  });

  const totalAmount = sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);

  const analysis: PaymentMethodAnalysis[] = Object.entries(methodStats).map(
    ([method, stats]) => ({
      method,
      count: stats.count,
      totalAmount: stats.totalAmount,
      percentage: totalAmount > 0 ? (stats.totalAmount / totalAmount) * 100 : 0,
    })
  );

  return analysis.sort((a, b) => b.totalAmount - a.totalAmount);
}

/**
 * Get regional sales analysis
 */
export async function getRegionalSales(
  ownerId: string,
  startDate?: Date,
  endDate?: Date
): Promise<RegionalSalesData[]> {
  const where: any = {
    ownerId,
    status: "COMPLETED",
  };

  if (startDate || endDate) {
    where.saleDate = {};
    if (startDate) where.saleDate.gte = startDate;
    if (endDate) where.saleDate.lte = endDate;
  }

  const sales = await prisma.sale.findMany({
    where,
    include: {
      saleRegion: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const regionStats: Record<string, { name: string; sales: number; revenue: number }> = {};

  sales.forEach((sale) => {
    if (sale.saleRegion) {
      const regionId = sale.saleRegion.id;
      if (!regionStats[regionId]) {
        regionStats[regionId] = {
          name: sale.saleRegion.name,
          sales: 0,
          revenue: 0,
        };
      }
      regionStats[regionId].sales++;
      regionStats[regionId].revenue += Number(sale.totalAmount);
    }
  });

  const regionalData: RegionalSalesData[] = Object.entries(regionStats).map(
    ([regionId, stats]) => ({
      regionId,
      regionName: stats.name,
      totalSales: stats.sales,
      totalRevenue: stats.revenue,
      averageOrderValue: stats.sales > 0 ? stats.revenue / stats.sales : 0,
    })
  );

  return regionalData.sort((a, b) => b.totalRevenue - a.totalRevenue);
}

/**
 * Get best selling products
 */
export async function getBestSellingProducts(
  ownerId: string,
  limit: number = 10,
  startDate?: Date,
  endDate?: Date
) {
  const saleWhere: any = {
    ownerId,
    status: "COMPLETED",
  };

  if (startDate || endDate) {
    saleWhere.saleDate = {};
    if (startDate) saleWhere.saleDate.gte = startDate;
    if (endDate) saleWhere.saleDate.lte = endDate;
  }

  const where: any = {
    sale: saleWhere,
  };

  const saleItems = await prisma.saleItem.findMany({
    where,
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
        },
      },
    },
  });

  const productStats: Record<string, { name: string; sku: string; quantity: number; revenue: number }> = {};

  saleItems.forEach((item) => {
    const productId = item.productId || item.productName;
    if (!productStats[productId]) {
      productStats[productId] = {
        name: item.productName,
        sku: item.product?.sku || "N/A",
        quantity: 0,
        revenue: 0,
      };
    }
    productStats[productId].quantity += item.quantity;
    productStats[productId].revenue += Number(item.totalPrice);
  });

  const bestSellers = Object.entries(productStats)
    .map(([productId, stats]) => ({
      productId,
      productName: stats.name,
      sku: stats.sku,
      totalQuantity: stats.quantity,
      totalRevenue: stats.revenue,
      averagePrice: stats.quantity > 0 ? stats.revenue / stats.quantity : 0,
    }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, limit);

  return bestSellers;
}

