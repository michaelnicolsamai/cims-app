import { prisma } from "@/lib/db";
import { Customer } from "@prisma/client";

/**
 * RFM Analysis - Industry standard customer segmentation
 * R = Recency (days since last purchase)
 * F = Frequency (number of purchases)
 * M = Monetary (total amount spent)
 */
export interface RFMScore {
  recency: number; // 1-5 (5 = most recent)
  frequency: number; // 1-5 (5 = most frequent)
  monetary: number; // 1-5 (5 = highest value)
  rfmScore: string; // e.g., "555", "432", etc.
  segment: string; // e.g., "Champions", "Loyal Customers", etc.
}

export interface RFMAnalysis {
  customerId: string;
  customerName: string;
  rfmScore: RFMScore;
  recommendations: string[];
}

/**
 * Calculate RFM scores for a customer
 */
export async function calculateRFMScore(
  customer: Customer & {
    sales: Array<{
      totalAmount: number;
      saleDate: Date;
      paymentStatus: string;
    }>;
  }
): Promise<RFMScore> {
  const now = new Date();
  const sales = customer.sales || [];
  const completedSales = sales.filter((s) => s.paymentStatus === "PAID");

  // Recency: Days since last purchase
  let recencyDays = 999;
  if (customer.lastVisit) {
    recencyDays = Math.floor(
      (now.getTime() - customer.lastVisit.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  // Frequency: Number of purchases
  const frequency = completedSales.length;

  // Monetary: Total amount spent
  const monetary = Number(customer.totalSpent) || 0;

  // Calculate quintiles (divide into 5 groups)
  // We'll use percentile-based scoring
  const recencyScore = calculateRecencyScore(recencyDays);
  const frequencyScore = calculateFrequencyScore(frequency);
  const monetaryScore = calculateMonetaryScore(monetary);

  const rfmScore = `${recencyScore}${frequencyScore}${monetaryScore}`;
  const segment = getRFMSegment(recencyScore, frequencyScore, monetaryScore);

  return {
    recency: recencyScore,
    frequency: frequencyScore,
    monetary: monetaryScore,
    rfmScore,
    segment,
  };
}

/**
 * Calculate Recency Score (1-5)
 * Lower days = Higher score
 */
function calculateRecencyScore(days: number): number {
  if (days <= 30) return 5; // Very recent
  if (days <= 60) return 4; // Recent
  if (days <= 90) return 3; // Moderate
  if (days <= 180) return 2; // Not recent
  return 1; // Very old
}

/**
 * Calculate Frequency Score (1-5)
 * More purchases = Higher score
 */
function calculateFrequencyScore(frequency: number): number {
  if (frequency >= 20) return 5; // Very frequent
  if (frequency >= 10) return 4; // Frequent
  if (frequency >= 5) return 3; // Moderate
  if (frequency >= 2) return 2; // Infrequent
  return 1; // Very infrequent
}

/**
 * Calculate Monetary Score (1-5)
 * Higher spending = Higher score
 */
function calculateMonetaryScore(monetary: number): number {
  if (monetary >= 1000000) return 5; // Very high value
  if (monetary >= 500000) return 4; // High value
  if (monetary >= 200000) return 3; // Moderate value
  if (monetary >= 50000) return 2; // Low value
  return 1; // Very low value
}

/**
 * Map RFM scores to customer segments
 */
function getRFMSegment(
  recency: number,
  frequency: number,
  monetary: number
): string {
  // Champions: High R, High F, High M
  if (recency >= 4 && frequency >= 4 && monetary >= 4) {
    return "Champions";
  }
  // Loyal Customers: High R, High F, Medium M
  if (recency >= 4 && frequency >= 4 && monetary >= 3) {
    return "Loyal Customers";
  }
  // Potential Loyalists: High R, Medium F, High M
  if (recency >= 4 && frequency >= 3 && monetary >= 4) {
    return "Potential Loyalists";
  }
  // New Customers: High R, Low F, Any M
  if (recency >= 4 && frequency <= 2) {
    return "New Customers";
  }
  // Promising: High R, Low F, Medium M
  if (recency >= 4 && frequency <= 2 && monetary >= 3) {
    return "Promising";
  }
  // Need Attention: Medium R, Any F, Any M
  if (recency === 3) {
    return "Need Attention";
  }
  // About to Sleep: Low R, Medium F, Any M
  if (recency <= 2 && frequency >= 3) {
    return "About to Sleep";
  }
  // At Risk: Low R, High F, High M
  if (recency <= 2 && frequency >= 4 && monetary >= 4) {
    return "At Risk";
  }
  // Cannot Lose Them: Low R, High F, High M
  if (recency <= 2 && frequency >= 4 && monetary >= 4) {
    return "Cannot Lose Them";
  }
  // Hibernating: Low R, Low F, Medium M
  if (recency <= 2 && frequency <= 2 && monetary >= 3) {
    return "Hibernating";
  }
  // Lost: Low R, Low F, Low M
  if (recency <= 2 && frequency <= 2 && monetary <= 2) {
    return "Lost";
  }

  return "Regular";
}

/**
 * Get RFM analysis for a customer
 */
export async function getCustomerRFMAnalysis(
  customerId: string
): Promise<RFMAnalysis> {
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

  const rfmScore = await calculateRFMScore(customer);
  const recommendations = getRFMRecommendations(rfmScore);

  return {
    customerId: customer.id,
    customerName: customer.name,
    rfmScore,
    recommendations,
  };
}

/**
 * Get recommendations based on RFM segment
 */
function getRFMRecommendations(rfmScore: RFMScore): string[] {
  const recommendations: string[] = [];
  const { segment, recency, frequency, monetary } = rfmScore;

  switch (segment) {
    case "Champions":
      recommendations.push("Reward them with exclusive offers");
      recommendations.push("Ask for referrals and testimonials");
      recommendations.push("Upsell premium products/services");
      break;

    case "Loyal Customers":
      recommendations.push("Offer loyalty program benefits");
      recommendations.push("Introduce new products to them");
      recommendations.push("Request feedback and reviews");
      break;

    case "Potential Loyalists":
      recommendations.push("Create brand awareness campaigns");
      recommendations.push("Offer membership or subscription programs");
      recommendations.push("Provide personalized recommendations");
      break;

    case "New Customers":
      recommendations.push("Send welcome series emails");
      recommendations.push("Offer first-time buyer discounts");
      recommendations.push("Educate about your products/services");
      break;

    case "Need Attention":
      recommendations.push("Re-engage with special offers");
      recommendations.push("Send personalized messages");
      recommendations.push("Ask why they haven't purchased recently");
      break;

    case "About to Sleep":
      recommendations.push("Win-back campaign with discounts");
      recommendations.push("Remind them of your value proposition");
      recommendations.push("Offer reactivation incentives");
      break;

    case "At Risk":
      recommendations.push("Urgent win-back campaign");
      recommendations.push("Offer significant discounts");
      recommendations.push("Personal outreach from management");
      break;

    case "Cannot Lose Them":
      recommendations.push("Immediate personal contact");
      recommendations.push("Offer exclusive deals");
      recommendations.push("Create VIP program for them");
      break;

    case "Hibernating":
      recommendations.push("Reactivation campaign");
      recommendations.push('Offer "new customer" deals');
      recommendations.push("Survey to understand why they left");
      break;

    case "Lost":
      recommendations.push("Win-back campaign with aggressive pricing");
      recommendations.push("Survey to understand churn reasons");
      recommendations.push("Consider removing from active marketing");
      break;

    default:
      recommendations.push("Continue regular engagement");
      recommendations.push("Monitor for changes in behavior");
  }

  // Add specific recommendations based on low scores
  if (recency <= 2) {
    recommendations.push("Focus on improving recency with time-sensitive offers");
  }
  if (frequency <= 2) {
    recommendations.push("Increase purchase frequency with subscription or bundle offers");
  }
  if (monetary <= 2) {
    recommendations.push("Increase order value with upsells and cross-sells");
  }

  return recommendations;
}

/**
 * Get RFM analysis for all customers of a business
 */
export async function getAllCustomersRFMAnalysis(
  ownerId: string
): Promise<RFMAnalysis[]> {
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

  const analyses = await Promise.all(
    customers.map(async (customer) => {
      const rfmScore = await calculateRFMScore(customer);
      const recommendations = getRFMRecommendations(rfmScore);

      return {
        customerId: customer.id,
        customerName: customer.name,
        rfmScore,
        recommendations,
      };
    })
  );

  return analyses;
}

