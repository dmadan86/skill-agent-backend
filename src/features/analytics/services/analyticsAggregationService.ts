import mongoose from "mongoose";
import { Team } from "../../../shared/models/Team";
import { AggregatedAnalytics } from "../../../shared/models/AggregatedAnalytics";
import * as analyticsService from "./analyticsService";
import * as progressAnalyticsService from "./progressAnalyticsService";
import * as trainingAnalyticsService from "./trainingAnalyticsService";
import * as evaluationAnalyticsService from "./evaluationAnalyticsService";
import logger from "../../../shared/utils/logger";

/**
 * Aggregate analytics data for a specific team
 */
export const aggregateTeamAnalytics = async (teamId: string): Promise<void> => {
  try {
    logger.info(`Starting analytics aggregation for team: ${teamId}`);

    // Check if team exists
    const team = await Team.findById(teamId);
    if (!team) {
      logger.error(`Team not found: ${teamId}`);
      return;
    }

    // Check if team has any members (including owner)
    const memberCount = team.members.length + 1; // +1 for owner
    if (memberCount <= 1) {
      logger.info(`Skipping team ${teamId} - has only ${memberCount} member`);
      return;
    }

    // Define time ranges to aggregate
    const timeRanges = [
      "last7days",
      "last30days",
      "last90days",
      "ytd",
    ] as const;

    // Create an aggregation record for today if it doesn't exist
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate analytics metrics for each time range
    for (const timeRange of timeRanges) {
      let aggregation;
      try {
        logger.info(`Aggregating ${timeRange} data for team: ${teamId}`);

        // Try to find an existing aggregation record
        aggregation = await AggregatedAnalytics.findOne({
          teamId: new mongoose.Types.ObjectId(teamId),
          date: today,
        });

        // Skip if already completed for this time range
        if (aggregation && aggregation.status === "completed") {
          logger.info(
            `Aggregation for team ${teamId} already completed, skipping`,
          );
          continue;
        }

        // Create a new record if none exists
        if (!aggregation) {
          aggregation = new AggregatedAnalytics({
            teamId: new mongoose.Types.ObjectId(teamId),
            date: today,
            status: "partial",
          });
        } else {
          // Update status to partial if it's not already
          aggregation.status = "partial";
        }

        // Save the initial status
        await aggregation.save();

        // Get overview metrics
        const overviewMetrics = await analyticsService.getOverviewMetrics(
          teamId,
          timeRange,
          team.owner.toString(),
        );

        // Get performance timeline
        const performanceTimeline =
          await analyticsService.getPerformanceTimeline(
            teamId,
            timeRange,
            team.owner.toString(),
          );

        // Get team member progress
        const teamMemberProgress =
          await progressAnalyticsService.getTeamMemberProgress(
            teamId,
            timeRange,
            team.owner.toString(),
          );

        // Get department performance
        const departmentPerformance =
          await progressAnalyticsService.getDepartmentPerformance(
            teamId,
            timeRange,
            team.owner.toString(),
          );

        // Get training category metrics
        const trainingCategoryMetrics =
          await trainingAnalyticsService.getTrainingAgentTypeMetrics(
            teamId,
            timeRange,
            team.owner.toString(),
          );

        // Get learning trends
        const learningTrends = await trainingAnalyticsService.getLearningTrends(
          teamId,
          timeRange,
          team.owner.toString(),
        );

        // Get score distribution
        const scoreDistribution =
          await evaluationAnalyticsService.getScoreDistribution(
            teamId,
            timeRange,
            team.owner.toString(),
          );

        // Get skill assessment
        const skillAssessment =
          await evaluationAnalyticsService.getSkillAssessment(
            teamId,
            timeRange,
            team.owner.toString(),
          );

        // Get assessment insights
        const assessmentInsights =
          await evaluationAnalyticsService.getAssessmentInsights(
            teamId,
            timeRange,
            team.owner.toString(),
          );

        // Update aggregation record with the calculated metrics
        aggregation.overviewMetrics = overviewMetrics;
        aggregation.performanceTimeline = performanceTimeline.timeline;

        // Convert string IDs to ObjectIds for team member progress
        const convertedTeamMemberProgress = teamMemberProgress.members.map(
          (member) => ({
            ...member,
            userId: new mongoose.Types.ObjectId(member.userId),
          }),
        );
        aggregation.teamMemberProgress = convertedTeamMemberProgress;

        // Convert string IDs to ObjectIds for department performance
        const convertedDepartmentPerformance =
          departmentPerformance.departments.map((dept) => ({
            ...dept,
            departmentId: dept.departmentId
              ? new mongoose.Types.ObjectId(dept.departmentId)
              : null,
          }));
        aggregation.departmentPerformance = convertedDepartmentPerformance;

        aggregation.trainingCategoryMetrics =
          trainingCategoryMetrics.categories;
        aggregation.learningTrends = learningTrends.trends;
        aggregation.scoreDistribution = scoreDistribution;
        aggregation.skillAssessment = skillAssessment.skills;
        aggregation.assessmentInsights = assessmentInsights;

        // Mark as completed
        aggregation.status = "completed";
        await aggregation.save();

        logger.info(
          `Successfully aggregated ${timeRange} data for team: ${teamId}`,
        );
      } catch (error) {
        // If an error occurs, update the aggregation record with failed status
        if (aggregation) {
          aggregation.status = "failed";
          // Log the error details
          logger.error(
            `Error details for team ${teamId}: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
          await aggregation.save();
        }

        logger.error(
          `Error aggregating ${timeRange} data for team ${teamId}: ${error}`,
        );
      }
    }

    logger.info(`Completed analytics aggregation for team: ${teamId}`);
  } catch (error) {
    logger.error(`Error in analytics aggregation for team ${teamId}: ${error}`);
  }
};

/**
 * Aggregate analytics data for all teams
 */
export const aggregateAllTeamsAnalytics = async (): Promise<void> => {
  try {
    logger.info("Starting analytics aggregation for all teams");

    // Find all teams
    const teams = await Team.find({}).lean();

    if (teams.length === 0) {
      logger.info("No teams found for analytics aggregation");
      return;
    }

    logger.info(`Found ${teams.length} teams for analytics aggregation`);

    // Use batch processing to avoid overwhelming the server
    const BATCH_SIZE = 5;
    const teamBatches = [];

    // Split teams into batches
    for (let i = 0; i < teams.length; i += BATCH_SIZE) {
      teamBatches.push(teams.slice(i, i + BATCH_SIZE));
    }

    // Process each batch sequentially
    for (const [batchIndex, batch] of teamBatches.entries()) {
      logger.info(
        `Processing batch ${batchIndex + 1}/${teamBatches.length} (${batch.length} teams)`,
      );

      // Process teams in the batch concurrently
      await Promise.all(
        batch.map((team) =>
          aggregateTeamAnalytics(team._id ? team._id.toString() : "").catch(
            (error) => {
              logger.error(`Error aggregating team ${team._id}: ${error}`);
              // Continue with other teams even if one fails
              return Promise.resolve();
            },
          ),
        ),
      );
    }

    logger.info("Completed analytics aggregation for all teams");
  } catch (error) {
    logger.error(`Error in analytics aggregation for all teams: ${error}`);
    throw error; // Re-throw to allow retry mechanism to work
  }
};

/**
 * Get aggregated analytics data for a specific team and time range
 */
export const getAggregatedAnalytics = async (
  teamId: string,
  timeRange: string | { startDate: string; endDate: string },
  metric: string,
): Promise<any> => {
  try {
    // If using custom date range, we need to calculate the metrics on-the-fly
    if (typeof timeRange === "object") {
      return null;
    }

    // For predefined ranges, check if we have aggregated data
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Only use aggregated data from today
    const aggregation = await AggregatedAnalytics.findOne({
      teamId: new mongoose.Types.ObjectId(teamId),
      date: today,
      status: "completed",
    });

    if (!aggregation) {
      logger.debug(
        `No aggregated analytics found for team ${teamId} for metric ${metric}`,
      );
      return null;
    }

    // Return the requested metrics
    let result;
    switch (metric) {
      case "overview":
        result = aggregation.overviewMetrics;
        break;
      case "performanceTimeline":
        result = { timeline: aggregation.performanceTimeline };
        break;
      case "teamMemberProgress":
        result = {
          members: aggregation.teamMemberProgress.map((member) => ({
            userId: member.userId.toString(),
            name: member.name,
            trainingProgress: member.trainingProgress,
            evaluationScore: member.evaluationScore,
            skillGrowth: member.skillGrowth,
          })),
        };
        break;
      case "departmentPerformance":
        result = {
          departments: aggregation.departmentPerformance.map((dept) => ({
            departmentId: dept.departmentId
              ? dept.departmentId.toString()
              : null,
            name: dept.name,
            averageScore: dept.averageScore,
            completionRate: dept.completionRate,
            memberCount: dept.memberCount,
          })),
        };
        break;
      case "trainingCategoryMetrics":
        result = { categories: aggregation.trainingCategoryMetrics };
        break;
      case "learningTrends":
        result = { trends: aggregation.learningTrends };
        break;
      case "scoreDistribution":
        result = aggregation.scoreDistribution;
        break;
      case "skillAssessment":
        result = { skills: aggregation.skillAssessment };
        break;
      case "assessmentInsights":
        result = aggregation.assessmentInsights;
        break;
      default:
        result = null;
    }

    if (!result) {
      logger.debug(
        `No data found for metric ${metric} in aggregated analytics for team ${teamId}`,
      );
    }

    return result;
  } catch (error) {
    logger.error(
      `Error retrieving aggregated analytics for team ${teamId}, metric ${metric}: ${error}`,
    );
    return null; // Fail gracefully
  }
};
