import { prisma } from "@/lib/db";
import { updateAllLoyaltyScores } from "./loyalty-score.service";
import { segmentCustomers } from "./customer-segmentation.service";
import { generateAndSaveInsights } from "./automated-insights.service";

export interface BatchAnalyticsResult {
  success: boolean;
  tasksCompleted: string[];
  errors: string[];
  duration: number; // milliseconds
}

/**
 * Run batch analytics processing for a business
 * Updates all customer scores, segments, and generates insights
 */
export async function runBatchAnalytics(
  ownerId: string
): Promise<BatchAnalyticsResult> {
  const startTime = Date.now();
  const tasksCompleted: string[] = [];
  const errors: string[] = [];

  try {
    // 1. Update all loyalty scores
    try {
      await updateAllLoyaltyScores(ownerId);
      tasksCompleted.push("Updated all customer loyalty scores");
    } catch (error: any) {
      errors.push(`Failed to update loyalty scores: ${error.message}`);
    }

    // 2. Re-segment customers
    try {
      await segmentCustomers(ownerId);
      tasksCompleted.push("Re-segmented all customers");
    } catch (error: any) {
      errors.push(`Failed to segment customers: ${error.message}`);
    }

    // 3. Generate automated insights
    try {
      await generateAndSaveInsights(ownerId);
      tasksCompleted.push("Generated automated insights");
    } catch (error: any) {
      errors.push(`Failed to generate insights: ${error.message}`);
    }

    const duration = Date.now() - startTime;

    return {
      success: errors.length === 0,
      tasksCompleted,
      errors,
      duration,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    return {
      success: false,
      tasksCompleted,
      errors: [...errors, `Batch processing failed: ${error.message}`],
      duration,
    };
  }
}

/**
 * Run batch analytics for all businesses (admin function)
 */
export async function runBatchAnalyticsForAll(): Promise<{
  totalBusinesses: number;
  successful: number;
  failed: number;
  results: Array<{ ownerId: string; result: BatchAnalyticsResult }>;
}> {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  const results = await Promise.all(
    users.map(async (user) => {
      const result = await runBatchAnalytics(user.id);
      return { ownerId: user.id, result };
    })
  );

  const successful = results.filter((r) => r.result.success).length;
  const failed = results.length - successful;

  return {
    totalBusinesses: users.length,
    successful,
    failed,
    results,
  };
}

