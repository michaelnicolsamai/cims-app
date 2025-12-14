import { prisma } from "@/lib/db";
import { Customer } from "@prisma/client";
import { calculateLoyaltyScore } from "./loyalty-score.service";
import { calculateChurnRisk, ChurnRiskAnalysis } from "./churn-risk.service";
import { segmentCustomers, CustomerSegment } from "./customer-segmentation.service";

export interface CustomerInsight {
  customerId: string;
  customerName: string;
  loyaltyScore: number;
  churnRisk: ChurnRiskAnalysis;
  segment: CustomerSegment;
  totalSpent: number;
  totalVisits: number;
  averageOrderValue: number;
  lastVisitDate: Date | null;
  daysSinceLastVisit: number | null;
  preferredPaymentMethod: string | null;
  topProducts: Array<{ productName: string; quantity: number }>;
  growthTrend: "INCREASING" | "STABLE" | "DECREASING";
}

/**
 * Get comprehensive insights for a single customer
 */
export async function getCustomerInsights(customerId: string): Promise<CustomerInsight> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      sales: {
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          saleDate: "desc",
        },
      },
    },
  });

  if (!customer) {
    throw new Error("Customer not found");
  }

  const sales = customer.sales || [];
  const now = new Date();

  // Calculate loyalty score
  const loyaltyScore = await calculateLoyaltyScore(customer);

  // Calculate churn risk
  const churnRisk = await calculateChurnRisk(customer);

  // Determine segment
  const segments = await segmentCustomers(customer.ownerId);
  const customerSegment = segments.find((s) =>
    s.customers.some((c) => c.id === customerId)
  )?.segment || "REGULAR";

  // Calculate average order value
  const totalSpent = Number(customer.totalSpent);
  const averageOrderValue = sales.length > 0 ? totalSpent / sales.length : 0;

  // Days since last visit
  const daysSinceLastVisit = customer.lastVisit
    ? Math.floor((now.getTime() - customer.lastVisit.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Preferred payment method
  const paymentMethods = sales.map((s) => s.paymentMethod);
  const paymentMethodCounts = paymentMethods.reduce((acc, method) => {
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const preferredPaymentMethod =
    Object.keys(paymentMethodCounts).length > 0
      ? Object.entries(paymentMethodCounts).sort((a, b) => b[1] - a[1])[0][0]
      : null;

  // Top products
  const productCounts: Record<string, number> = {};
  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      const productName = item.productName;
      productCounts[productName] = (productCounts[productName] || 0) + item.quantity;
    });
  });
  const topProducts = Object.entries(productCounts)
    .map(([productName, quantity]) => ({ productName, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Growth trend (compare last 90 days to previous 90 days)
  const recentSales = sales.filter(
    (s) => (now.getTime() - s.saleDate.getTime()) / (1000 * 60 * 60 * 24) <= 90
  );
  const olderSales = sales.filter(
    (s) => {
      const days = (now.getTime() - s.saleDate.getTime()) / (1000 * 60 * 60 * 24);
      return days > 90 && days <= 180;
    }
  );

  let growthTrend: "INCREASING" | "STABLE" | "DECREASING" = "STABLE";
  if (recentSales.length > 0 && olderSales.length > 0) {
    const recentTotal = recentSales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
    const olderTotal = olderSales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
    const change = ((recentTotal - olderTotal) / olderTotal) * 100;

    if (change > 10) growthTrend = "INCREASING";
    else if (change < -10) growthTrend = "DECREASING";
  } else if (recentSales.length > 0 && olderSales.length === 0) {
    growthTrend = "INCREASING";
  } else if (recentSales.length === 0 && olderSales.length > 0) {
    growthTrend = "DECREASING";
  }

  return {
    customerId: customer.id,
    customerName: customer.name,
    loyaltyScore,
    churnRisk,
    segment: customerSegment,
    totalSpent,
    totalVisits: customer.totalVisits,
    averageOrderValue,
    lastVisitDate: customer.lastVisit,
    daysSinceLastVisit,
    preferredPaymentMethod,
    topProducts,
    growthTrend,
  };
}

/**
 * Get insights for top customers
 */
export async function getTopCustomersInsights(
  ownerId: string,
  limit: number = 10
): Promise<CustomerInsight[]> {
  const customers = await prisma.customer.findMany({
    where: { ownerId },
    orderBy: {
      totalSpent: "desc",
    },
    take: limit,
  });

  const insights = await Promise.all(
    customers.map((c) => getCustomerInsights(c.id))
  );

  return insights;
}

