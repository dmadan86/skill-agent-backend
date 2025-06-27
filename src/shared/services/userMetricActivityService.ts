import { UserMetricActivity, IUserMetricActivity } from "../models/UserMetricActivity";

export class UserMetricActivityService {
  /**
   * Create a new user metric activity
   */
  static async createActivity(data: {
    userId: string;
    activityType: IUserMetricActivity['activityType'];
    feature: IUserMetricActivity['feature'];
    metadata?: Record<string, any>;
    status?: 'success' | 'failed';
    duration?: number;
  }): Promise<IUserMetricActivity> {
    try {
      const activity = new UserMetricActivity({
        ...data,
        timestamp: new Date()
      });
      return await activity.save();
    } catch (error) {
      console.error('Error creating user metric activity:', error);
      throw error;
    }
  }

  /**
   * Get feature usage statistics for analytics
   */
  static async getFeatureUsageStats(timeframe: 'day' | 'week' | 'month' = 'week') {
    const startDate = new Date();
    switch (timeframe) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    try {
      const stats = await UserMetricActivity.aggregate([
        {
          $match: {
            timestamp: { $gte: startDate },
            status: 'success'
          }
        },
        {
          $group: {
            _id: {
              feature: '$feature',
              activityType: '$activityType'
            },
            count: { $sum: 1 },
            uniqueUsers: { $addToSet: '$userId' }
          }
        },
        {
          $group: {
            _id: '$_id.feature',
            activities: {
              $push: {
                activityType: '$_id.activityType',
                count: '$count',
                uniqueUsers: { $size: '$uniqueUsers' }
              }
            },
            totalUsage: { $sum: '$count' },
            totalUniqueUsers: { $addToSet: '$uniqueUsers' }
          }
        },
        {
          $project: {
            feature: '$_id',
            activities: 1,
            totalUsage: 1,
            totalUniqueUsers: { $size: { $reduce: { input: '$totalUniqueUsers', initialValue: [], in: { $concatArrays: ['$$value', '$$this'] } } } }
          }
        },
        {
          $sort: { totalUsage: -1 }
        }
      ]);

      return stats;
    } catch (error) {
      console.error('Error getting feature usage stats:', error);
      throw error;
    }
  }

  /**
   * Get user activity timeline
   */
  static async getUserActivityTimeline(userId: string, limit: number = 50) {
    try {
      return await UserMetricActivity.find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit);
    } catch (error) {
      console.error('Error getting user activity timeline:', error);
      throw error;
    }
  }

  /**
   * Get system-wide activity statistics
   */
  static async getSystemActivityStats() {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days

    try {
      const stats = await UserMetricActivity.aggregate([
        {
          $match: {
            timestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
              activityType: '$activityType'
            },
            count: { $sum: 1 },
            successCount: {
              $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
            },
            failedCount: {
              $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
            }
          }
        },
        {
          $group: {
            _id: '$_id.date',
            activities: {
              $push: {
                activityType: '$_id.activityType',
                count: '$count',
                successCount: '$successCount',
                failedCount: '$failedCount'
              }
            },
            totalActivities: { $sum: '$count' }
          }
        },
        {
          $sort: { _id: -1 }
        }
      ]);

      return stats;
    } catch (error) {
      console.error('Error getting system activity stats:', error);
      throw error;
    }
  }
} 