import cron, { ScheduledTask } from "node-cron";
import logger from "../utils/logger";
import { aggregateAllTeamsAnalytics } from "../../features/analytics/services/analyticsAggregationService";
import config from "../config";

// Maximum number of retries for failed operations
const MAX_RETRIES = 3;
// Initial delay for retry in milliseconds
const INITIAL_RETRY_DELAY = 60000; // 1 minute

/**
 * Class to manage scheduled tasks in the application
 */
export class SchedulerService {
  private analyticsAggregationTask: ScheduledTask | null = null;
  private isRunningAggregation = false;
  private retryCount = 0;

  /**
   * Initialize all scheduled tasks
   */
  public initialize(): void {
    this.scheduleAnalyticsAggregation();
    logger.info("Scheduler service initialized");
  }

  /**
   * Schedule the daily analytics aggregation
   * Runs at midnight (00:00) every day
   */
  private scheduleAnalyticsAggregation(): void {
    try {
      // Check if analytics aggregation is enabled via environment configuration
      if (!config.analytics.aggregationScheduled) {
        logger.info(
          "Analytics aggregation scheduling is disabled by configuration",
        );
        return;
      }

      // Schedule for midnight (00:00) every day
      this.analyticsAggregationTask = cron.schedule("0 0 * * *", () => {
        this.executeAnalyticsAggregation();
      });

      logger.info("Analytics aggregation scheduled for midnight daily");
    } catch (error) {
      logger.error(`Error scheduling analytics aggregation: ${error}`);
    }
  }

  /**
   * Execute the analytics aggregation with retry logic
   */
  private async executeAnalyticsAggregation(): Promise<void> {
    // Prevent concurrent execution
    if (this.isRunningAggregation) {
      logger.warn(
        "Analytics aggregation already running, skipping this execution",
      );
      return;
    }

    this.isRunningAggregation = true;
    this.retryCount = 0;

    try {
      logger.info("Starting scheduled analytics aggregation");
      await aggregateAllTeamsAnalytics();
      logger.info("Scheduled analytics aggregation completed successfully");
      this.isRunningAggregation = false;
    } catch (error) {
      logger.error(`Error in scheduled analytics aggregation: ${error}`);
      this.retryAggregation();
    }
  }

  /**
   * Retry the analytics aggregation with exponential backoff
   */
  private retryAggregation(): void {
    this.retryCount++;

    if (this.retryCount <= MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, this.retryCount - 1);
      logger.info(
        `Scheduling retry ${this.retryCount}/${MAX_RETRIES} for analytics aggregation in ${delay / 1000} seconds`,
      );

      setTimeout(async () => {
        try {
          logger.info(
            `Executing retry ${this.retryCount} for analytics aggregation`,
          );
          await aggregateAllTeamsAnalytics();
          logger.info("Retry analytics aggregation completed successfully");
          this.isRunningAggregation = false;
        } catch (error) {
          logger.error(
            `Error in retry ${this.retryCount} of analytics aggregation: ${error}`,
          );
          this.retryAggregation();
        }
      }, delay);
    } else {
      logger.error(`Analytics aggregation failed after ${MAX_RETRIES} retries`);
      this.isRunningAggregation = false;
    }
  }

  /**
   * Stop all scheduled tasks
   */
  public stop(): void {
    if (this.analyticsAggregationTask) {
      this.analyticsAggregationTask.stop();
      this.analyticsAggregationTask = null;
    }
    logger.info("Scheduler service stopped");
  }

  /**
   * Run analytics aggregation immediately (useful for testing or manual trigger)
   */
  public async runAnalyticsAggregationNow(): Promise<void> {
    // Prevent concurrent execution
    if (this.isRunningAggregation) {
      logger.warn(
        "Analytics aggregation already running, cannot start manual execution",
      );
      throw new Error("Analytics aggregation already running");
    }

    logger.info("Running analytics aggregation manually");
    this.isRunningAggregation = true;
    this.retryCount = 0;

    try {
      await aggregateAllTeamsAnalytics();
      logger.info("Manual analytics aggregation completed successfully");
      this.isRunningAggregation = false;
    } catch (error) {
      this.isRunningAggregation = false;
      logger.error(`Error in manual analytics aggregation: ${error}`);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const schedulerService = new SchedulerService();

const jobs = new Map();

export function scheduleDelayedRepeatingJob(
  jobId: string,
  delayMs: number,
  cronExpr: string,
  taskFn: () => void,
) {
  setTimeout(() => {
    const job = cron.schedule(cronExpr, taskFn, { scheduled: true });
    jobs.set(jobId, job);
    console.log(`[${jobId}] repeating job started`);
    taskFn(); // Optional: also run immediately on first schedule
  }, delayMs);
}

export function cancelDelayedRepeatingJob(jobId: string) {
  const job = jobs.get(jobId);
  if (job) {
    job.stop();
    jobs.delete(jobId);
    console.log(`[${jobId}] repeating job stopped`);
  }
}
