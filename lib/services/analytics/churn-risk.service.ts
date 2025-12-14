import { prisma } from "@/lib/db";
import { Customer } from "@prisma/client";

export type ChurnRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface ChurnRiskAnalysis {
  riskLevel: ChurnRiskLevel;
  riskScore: number; // 0-100
  factors: string[];
  lastVisitDays: number | null;
  predictedChurnDate: Date | null;
  recommendations: string[];
}

/**
 * Calculate churn risk for a customer
 * Factors:
 * - Days since last visit
 * - Visit frequency decline
 * - Spending decline
 * - Payment issues
 */
export async function calculateChurnRisk(
  customer: Customer & {
    sales: Array<{
      totalAmount: number;
      saleDate: Date;
      paymentStatus: string;
    }>;
  }
): Promise<ChurnRiskAnalysis> {
  const now = new Date();
  const sales = customer.sales || [];
  const factors: string[] = [];
  const recommendations: string[] = [];

  // Calculate days since last visit
  const lastVisitDays = customer.lastVisit
    ? Math.floor((now.getTime() - customer.lastVisit.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  let riskScore = 0;

  // Factor 1: Recency (0-40 points)
  if (!customer.lastVisit) {
    riskScore += 40;
    factors.push("No recorded visits");
    recommendations.push("Reach out to welcome the customer back");
  } else if (lastVisitDays) {
    if (lastVisitDays > 180) {
      riskScore += 40;
      factors.push(`No visit in ${lastVisitDays} days (6+ months)`);
      recommendations.push("Urgent: Contact customer with special offer");
    } else if (lastVisitDays > 90) {
      riskScore += 30;
      factors.push(`No visit in ${lastVisitDays} days (3+ months)`);
      recommendations.push("Send personalized message or discount");
    } else if (lastVisitDays > 60) {
      riskScore += 20;
      factors.push(`No visit in ${lastVisitDays} days (2+ months)`);
      recommendations.push("Consider sending a reminder or promotion");
    } else if (lastVisitDays > 30) {
      riskScore += 10;
      factors.push(`No visit in ${lastVisitDays} days (1+ month)`);
    }
  }

  // Factor 2: Visit frequency decline (0-30 points)
  if (customer.firstVisit && customer.lastVisit) {
    const totalDays = Math.max(
      1,
      Math.floor((customer.lastVisit.getTime() - customer.firstVisit.getTime()) / (1000 * 60 * 60 * 24))
    );
    const avgVisitsPerMonth = (customer.totalVisits / totalDays) * 30;

    // Check recent activity (last 90 days)
    const recentSales = sales.filter(
      (s) => (now.getTime() - s.saleDate.getTime()) / (1000 * 60 * 60 * 24) <= 90
    );
    const recentVisitsPerMonth = (recentSales.length / 90) * 30;

    if (recentVisitsPerMonth < avgVisitsPerMonth * 0.5 && avgVisitsPerMonth > 0) {
      riskScore += 30;
      factors.push("Significant decline in visit frequency");
      recommendations.push("Investigate why customer visits have decreased");
    } else if (recentVisitsPerMonth < avgVisitsPerMonth * 0.7 && avgVisitsPerMonth > 0) {
      riskScore += 15;
      factors.push("Moderate decline in visit frequency");
    }
  }

  // Factor 3: Spending decline (0-20 points)
  if (sales.length >= 3) {
    const recentSales = sales
      .filter((s) => (now.getTime() - s.saleDate.getTime()) / (1000 * 60 * 60 * 24) <= 90)
      .map((s) => Number(s.totalAmount));
    const olderSales = sales
      .filter((s) => (now.getTime() - s.saleDate.getTime()) / (1000 * 60 * 60 * 24) > 90)
      .map((s) => Number(s.totalAmount));

    if (recentSales.length > 0 && olderSales.length > 0) {
      const recentAvg = recentSales.reduce((a, b) => a + b, 0) / recentSales.length;
      const olderAvg = olderSales.reduce((a, b) => a + b, 0) / olderSales.length;

      if (recentAvg < olderAvg * 0.5 && olderAvg > 0) {
        riskScore += 20;
        factors.push("Significant decline in spending");
        recommendations.push("Offer loyalty rewards or bulk purchase discounts");
      } else if (recentAvg < olderAvg * 0.7 && olderAvg > 0) {
        riskScore += 10;
        factors.push("Moderate decline in spending");
      }
    }
  }

  // Factor 4: Payment issues (0-10 points)
  const overdueSales = sales.filter(
    (s) => s.paymentStatus === "OVERDUE" || s.paymentStatus === "PENDING"
  ).length;
  if (overdueSales > 0) {
    riskScore += Math.min(10, overdueSales * 2);
    factors.push(`${overdueSales} overdue or pending payment(s)`);
    recommendations.push("Follow up on outstanding payments");
  }

  // Determine risk level
  let riskLevel: ChurnRiskLevel;
  if (riskScore >= 70) {
    riskLevel = "CRITICAL";
  } else if (riskScore >= 50) {
    riskLevel = "HIGH";
  } else if (riskScore >= 30) {
    riskLevel = "MEDIUM";
  } else {
    riskLevel = "LOW";
  }

  // Predict churn date (if high risk)
  let predictedChurnDate: Date | null = null;
  if (riskLevel === "CRITICAL" || riskLevel === "HIGH") {
    const daysUntilChurn = lastVisitDays ? lastVisitDays + 30 : 60;
    predictedChurnDate = new Date(now.getTime() + daysUntilChurn * 24 * 60 * 60 * 1000);
  }

  return {
    riskLevel,
    riskScore: Math.min(100, riskScore),
    factors,
    lastVisitDays,
    predictedChurnDate,
    recommendations,
  };
}

/**
 * Get churn risk for a specific customer
 */
export async function getCustomerChurnRisk(customerId: string): Promise<ChurnRiskAnalysis> {
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

  return calculateChurnRisk(customer);
}

/**
 * Get all customers with high churn risk for a business
 */
export async function getHighChurnRiskCustomers(
  ownerId: string,
  minRiskLevel: ChurnRiskLevel = "MEDIUM"
): Promise<Array<{ customer: Customer; analysis: ChurnRiskAnalysis }>> {
  const customers = await prisma.customer.findMany({
    where: { ownerId },
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

  const riskLevels: ChurnRiskLevel[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
  const minRiskIndex = riskLevels.indexOf(minRiskLevel);

  const results = await Promise.all(
    customers.map(async (customer) => {
      const analysis = await calculateChurnRisk(customer);
      return { customer, analysis };
    })
  );

  return results.filter((r) => {
    const riskIndex = riskLevels.indexOf(r.analysis.riskLevel);
    return riskIndex <= minRiskIndex;
  });
}

