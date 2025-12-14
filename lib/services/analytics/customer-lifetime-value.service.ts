import { prisma } from "@/lib/db";
import { Customer } from "@prisma/client";

/**
 * Customer Lifetime Value (CLV) calculation
 * CLV = (Average Order Value × Purchase Frequency × Customer Lifespan) - Customer Acquisition Cost
 */
export interface CustomerLifetimeValue {
  customerId: string;
  customerName: string;
  clv: number; // Predicted lifetime value
  averageOrderValue: number;
  purchaseFrequency: number; // Purchases per month
  customerLifespan: number; // Months
  predictedFutureValue: number; // Next 12 months
  customerValueTier: "HIGH" | "MEDIUM" | "LOW";
  recommendations: string[];
}

/**
 * Calculate Customer Lifetime Value for a customer
 */
export async function calculateCustomerLifetimeValue(
  customer: Customer & {
    sales: Array<{
      totalAmount: number;
      saleDate: Date;
      paymentStatus: string;
    }>;
  },
  averageAcquisitionCost: number = 0
): Promise<CustomerLifetimeValue> {
  const now = new Date();
  const sales = customer.sales || [];
  const completedSales = sales.filter((s) => s.paymentStatus === "PAID");

  // Calculate Average Order Value (AOV)
  const totalSpent = Number(customer.totalSpent) || 0;
  const averageOrderValue =
    completedSales.length > 0 ? totalSpent / completedSales.length : 0;

  // Calculate Purchase Frequency (purchases per month)
  let purchaseFrequency = 0;
  if (customer.firstVisit) {
    const daysSinceFirstVisit = Math.max(
      1,
      Math.floor(
        (now.getTime() - customer.firstVisit.getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
    const monthsSinceFirstVisit = daysSinceFirstVisit / 30;
    purchaseFrequency =
      monthsSinceFirstVisit > 0
        ? completedSales.length / monthsSinceFirstVisit
        : 0;
  }

  // Calculate Customer Lifespan (predicted months)
  // Based on recency and frequency patterns
  const customerLifespan = calculatePredictedLifespan(
    customer,
    completedSales,
    now
  );

  // Calculate CLV
  const clv =
    averageOrderValue * purchaseFrequency * customerLifespan -
    averageAcquisitionCost;

  // Predict future value (next 12 months)
  const predictedFutureValue = averageOrderValue * purchaseFrequency * 12;

  // Determine value tier
  const customerValueTier = getValueTier(clv);

  // Generate recommendations
  const recommendations = getCLVRecommendations(
    clv,
    purchaseFrequency,
    averageOrderValue,
    customerLifespan
  );

  return {
    customerId: customer.id,
    customerName: customer.name,
    clv: Math.max(0, clv),
    averageOrderValue,
    purchaseFrequency,
    customerLifespan,
    predictedFutureValue: Math.max(0, predictedFutureValue),
    customerValueTier,
    recommendations,
  };
}

/**
 * Predict customer lifespan based on behavior patterns
 */
function calculatePredictedLifespan(
  customer: Customer,
  sales: Array<{ saleDate: Date }>,
  now: Date
): number {
  if (sales.length === 0) {
    return 0;
  }

  // If customer is new (less than 3 months), use industry average (24 months)
  if (customer.firstVisit) {
    const daysSinceFirstVisit = Math.floor(
      (now.getTime() - customer.firstVisit.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceFirstVisit < 90) {
      return 24; // Default 2 years for new customers
    }
  }

  // Calculate average time between purchases
  if (sales.length < 2) {
    return 12; // Default 1 year if not enough data
  }

  const timeBetweenPurchases: number[] = [];
  for (let i = 1; i < sales.length; i++) {
    const daysBetween =
      (sales[i - 1].saleDate.getTime() - sales[i].saleDate.getTime()) /
      (1000 * 60 * 60 * 24);
    timeBetweenPurchases.push(daysBetween);
  }

  const avgDaysBetween =
    timeBetweenPurchases.reduce((a, b) => a + b, 0) /
    timeBetweenPurchases.length;

  // Predict lifespan: If they purchase every X days, how long will they continue?
  // Use churn probability based on recency
  let churnProbability = 0.1; // Base 10% monthly churn
  if (customer.lastVisit) {
    const daysSinceLastVisit = Math.floor(
      (now.getTime() - customer.lastVisit.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastVisit > 90) {
      churnProbability = 0.5; // 50% if inactive for 3+ months
    } else if (daysSinceLastVisit > 60) {
      churnProbability = 0.3; // 30% if inactive for 2+ months
    }
  }

  // Expected lifespan in months = 1 / monthly churn rate
  const expectedLifespanMonths = 1 / churnProbability;

  // Adjust based on purchase frequency (more frequent = longer lifespan)
  const frequencyMultiplier = Math.min(2, 1 + sales.length / 20);
  const adjustedLifespan = expectedLifespanMonths * frequencyMultiplier;

  return Math.max(6, Math.min(60, adjustedLifespan)); // Between 6 months and 5 years
}

/**
 * Determine customer value tier
 */
function getValueTier(clv: number): "HIGH" | "MEDIUM" | "LOW" {
  if (clv >= 500000) return "HIGH";
  if (clv >= 100000) return "MEDIUM";
  return "LOW";
}

/**
 * Get recommendations based on CLV
 */
function getCLVRecommendations(
  clv: number,
  frequency: number,
  aov: number,
  lifespan: number
): string[] {
  const recommendations: string[] = [];

  if (clv >= 500000) {
    recommendations.push("VIP treatment: Assign dedicated account manager");
    recommendations.push("Exclusive offers and early access to new products");
    recommendations.push("Request testimonials and case studies");
    recommendations.push("Referral program incentives");
  } else if (clv >= 100000) {
    recommendations.push("Loyalty program enrollment");
    recommendations.push("Regular personalized communications");
    recommendations.push("Cross-sell complementary products");
  } else {
    recommendations.push("Increase engagement with targeted campaigns");
    recommendations.push("Improve purchase frequency with subscription options");
    recommendations.push("Increase order value with bundle offers");
  }

  if (frequency < 1) {
    recommendations.push("Focus on increasing purchase frequency");
    recommendations.push("Consider subscription or membership model");
  }

  if (aov < 50000) {
    recommendations.push("Upsell higher-value products");
    recommendations.push("Create bundle offers to increase order size");
  }

  if (lifespan < 12) {
    recommendations.push("Win-back campaigns to extend customer relationship");
    recommendations.push("Improve customer satisfaction and retention");
  }

  return recommendations;
}

/**
 * Get CLV for a specific customer
 */
export async function getCustomerCLV(
  customerId: string,
  averageAcquisitionCost: number = 0
): Promise<CustomerLifetimeValue> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      sales: {
        select: {
          totalAmount: true,
          saleDate: true,
          paymentStatus: true,
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

  return calculateCustomerLifetimeValue(customer, averageAcquisitionCost);
}

/**
 * Get CLV for all customers and calculate average
 */
export async function getAverageCLV(ownerId: string): Promise<{
  averageCLV: number;
  totalCLV: number;
  highValueCustomers: number;
  mediumValueCustomers: number;
  lowValueCustomers: number;
}> {
  const customers = await prisma.customer.findMany({
    where: { ownerId },
    include: {
      sales: {
        select: {
          totalAmount: true,
          saleDate: true,
          paymentStatus: true,
        },
      },
    },
  });

  const clvValues = await Promise.all(
    customers.map((c) => calculateCustomerLifetimeValue(c))
  );

  const totalCLV = clvValues.reduce((sum, clv) => sum + clv.clv, 0);
  const averageCLV = clvValues.length > 0 ? totalCLV / clvValues.length : 0;

  const highValueCustomers = clvValues.filter(
    (clv) => clv.customerValueTier === "HIGH"
  ).length;
  const mediumValueCustomers = clvValues.filter(
    (clv) => clv.customerValueTier === "MEDIUM"
  ).length;
  const lowValueCustomers = clvValues.filter(
    (clv) => clv.customerValueTier === "LOW"
  ).length;

  return {
    averageCLV,
    totalCLV,
    highValueCustomers,
    mediumValueCustomers,
    lowValueCustomers,
  };
}

