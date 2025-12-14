import { prisma } from "@/lib/db";
import { Customer } from "@prisma/client";

export type CustomerSegment =
  | "VIP"
  | "LOYAL"
  | "REGULAR"
  | "AT_RISK"
  | "NEW"
  | "INACTIVE";

export interface CustomerSegmentData {
  segment: CustomerSegment;
  count: number;
  totalValue: number;
  averageValue: number;
  customers: Array<{
    id: string;
    name: string;
    totalSpent: number;
    loyaltyScore: number;
  }>;
}

/**
 * Segment customers based on their behavior and value
 */
export async function segmentCustomers(ownerId: string): Promise<CustomerSegmentData[]> {
  const customers = await prisma.customer.findMany({
    where: { ownerId },
    include: {
      sales: {
        select: {
          totalAmount: true,
          saleDate: true,
        },
      },
    },
    orderBy: {
      totalSpent: "desc",
    },
  });

  const now = new Date();
  const segments: Record<CustomerSegment, CustomerSegmentData> = {
    VIP: { segment: "VIP", count: 0, totalValue: 0, averageValue: 0, customers: [] },
    LOYAL: { segment: "LOYAL", count: 0, totalValue: 0, averageValue: 0, customers: [] },
    REGULAR: { segment: "REGULAR", count: 0, totalValue: 0, averageValue: 0, customers: [] },
    AT_RISK: { segment: "AT_RISK", count: 0, totalValue: 0, averageValue: 0, customers: [] },
    NEW: { segment: "NEW", count: 0, totalValue: 0, averageValue: 0, customers: [] },
    INACTIVE: { segment: "INACTIVE", count: 0, totalValue: 0, averageValue: 0, customers: [] },
  };

  // Calculate percentiles for segmentation
  const totalSpentValues = customers.map((c) => Number(c.totalSpent)).sort((a, b) => b - a);
  const top10Percentile = totalSpentValues[Math.floor(totalSpentValues.length * 0.1)] || 0;
  const top25Percentile = totalSpentValues[Math.floor(totalSpentValues.length * 0.25)] || 0;

  for (const customer of customers) {
    const totalSpent = Number(customer.totalSpent);
    const loyaltyScore = customer.loyaltyScore;
    const lastVisitDays = customer.lastVisit
      ? Math.floor((now.getTime() - customer.lastVisit.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    const daysSinceFirstVisit = customer.firstVisit
      ? Math.floor((now.getTime() - customer.firstVisit.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    let segment: CustomerSegment;

    // VIP: Top 10% by spending AND high loyalty
    if (totalSpent >= top10Percentile && loyaltyScore >= 80) {
      segment = "VIP";
    }
    // LOYAL: High loyalty score, regular visits
    else if (loyaltyScore >= 70 && lastVisitDays !== null && lastVisitDays <= 60) {
      segment = "LOYAL";
    }
    // INACTIVE: No visit in 180+ days
    else if (lastVisitDays === null || lastVisitDays > 180) {
      segment = "INACTIVE";
    }
    // AT_RISK: Declining activity or payment issues
    else if (
      (lastVisitDays && lastVisitDays > 90) ||
      loyaltyScore < 40 ||
      (customer.sales.some((s) => s.paymentStatus === "OVERDUE"))
    ) {
      segment = "AT_RISK";
    }
    // NEW: First visit within last 90 days
    else if (daysSinceFirstVisit !== null && daysSinceFirstVisit <= 90) {
      segment = "NEW";
    }
    // REGULAR: Everyone else
    else {
      segment = "REGULAR";
    }

    const segmentData = segments[segment];
    segmentData.count++;
    segmentData.totalValue += totalSpent;
    segmentData.customers.push({
      id: customer.id,
      name: customer.name,
      totalSpent,
      loyaltyScore,
    });
  }

  // Calculate averages
  Object.values(segments).forEach((segment) => {
    if (segment.count > 0) {
      segment.averageValue = segment.totalValue / segment.count;
    }
  });

  // Return segments in priority order
  return [
    segments.VIP,
    segments.LOYAL,
    segments.REGULAR,
    segments.NEW,
    segments.AT_RISK,
    segments.INACTIVE,
  ].filter((s) => s.count > 0);
}

/**
 * Get customers in a specific segment
 */
export async function getCustomersBySegment(
  ownerId: string,
  segment: CustomerSegment
): Promise<Customer[]> {
  const allSegments = await segmentCustomers(ownerId);
  const targetSegment = allSegments.find((s) => s.segment === segment);

  if (!targetSegment) {
    return [];
  }

  const customerIds = targetSegment.customers.map((c) => c.id);
  return prisma.customer.findMany({
    where: {
      ownerId,
      id: { in: customerIds },
    },
    orderBy: {
      totalSpent: "desc",
    },
  });
}

