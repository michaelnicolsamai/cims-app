import { prisma } from "@/lib/db";
import { Customer } from "@prisma/client";
import { calculateRFMScore } from "./rfm-analysis.service";

/**
 * Calculate loyalty score for a customer (0-100)
 * Enhanced with RFM analysis integration
 * Factors:
 * - Total spent (40%)
 * - Visit frequency (30%)
 * - Recency (20%)
 * - Payment behavior (10%)
 * 
 * Optionally uses RFM analysis for more accurate scoring
 */
export async function calculateLoyaltyScore(
  customer: Customer & {
    sales: Array<{
      totalAmount: number;
      saleDate: Date;
      paymentStatus: string;
    }>;
  },
  useRFM: boolean = false
): Promise<number> {
  const now = new Date();
  const sales = customer.sales || [];
  const totalSales = sales.length;

  // 1. Total Spent Score (0-40 points)
  // Normalize based on business average (assuming top 10% get max score)
  const totalSpent = Number(customer.totalSpent) || 0;
  const spentScore = Math.min(40, (totalSpent / 1000000) * 40); // 1M = max score

  // 2. Visit Frequency Score (0-30 points)
  // More visits = higher score
  const daysSinceFirstVisit = customer.firstVisit
    ? Math.max(1, Math.floor((now.getTime() - customer.firstVisit.getTime()) / (1000 * 60 * 60 * 24)))
    : 1;
  const visitsPerMonth = (customer.totalVisits / daysSinceFirstVisit) * 30;
  const frequencyScore = Math.min(30, (visitsPerMonth / 4) * 30); // 4 visits/month = max

  // 3. Recency Score (0-20 points)
  // Recent visits = higher score
  let recencyScore = 0;
  if (customer.lastVisit) {
    const daysSinceLastVisit = Math.floor(
      (now.getTime() - customer.lastVisit.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastVisit <= 7) recencyScore = 20;
    else if (daysSinceLastVisit <= 30) recencyScore = 15;
    else if (daysSinceLastVisit <= 90) recencyScore = 10;
    else if (daysSinceLastVisit <= 180) recencyScore = 5;
  }

  // 4. Payment Behavior Score (0-10 points)
  // On-time payments = higher score
  let paymentScore = 10;
  const overdueSales = sales.filter(
    (s) => s.paymentStatus === "OVERDUE" || s.paymentStatus === "PENDING"
  ).length;
  if (totalSales > 0) {
    const overdueRatio = overdueSales / totalSales;
    paymentScore = Math.max(0, 10 - overdueRatio * 10);
  }

  let totalScore = Math.round(spentScore + frequencyScore + recencyScore + paymentScore);
  
  // Enhance with RFM analysis if enabled
  if (useRFM) {
    try {
      const rfmScore = await calculateRFMScore(customer);
      // RFM provides additional context - boost score for high RFM customers
      const rfmBonus = (rfmScore.recency + rfmScore.frequency + rfmScore.monetary) / 3;
      // Add up to 10 bonus points based on RFM
      totalScore = Math.min(100, totalScore + (rfmBonus - 3) * 3.33);
    } catch (error) {
      // If RFM calculation fails, use base score
      console.warn("RFM calculation failed, using base loyalty score:", error);
    }
  }
  
  return Math.min(100, Math.max(0, totalScore));
}

/**
 * Update loyalty score for a customer
 */
export async function updateCustomerLoyaltyScore(customerId: string): Promise<number> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
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

  if (!customer) {
    throw new Error("Customer not found");
  }

  const score = await calculateLoyaltyScore(customer);

  await prisma.customer.update({
    where: { id: customerId },
    data: { loyaltyScore: score },
  });

  return score;
}

/**
 * Batch update loyalty scores for all customers of a business
 */
export async function updateAllLoyaltyScores(ownerId: string): Promise<void> {
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

  for (const customer of customers) {
    const score = await calculateLoyaltyScore(customer);
    await prisma.customer.update({
      where: { id: customer.id },
      data: { loyaltyScore: score },
    });
  }
}

