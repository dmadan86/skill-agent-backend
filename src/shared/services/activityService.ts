import { AppError } from "../errors/AppError";
import Activity, { IActivity } from "../models/Activity";
import User from "../models/User";
import logger from "../utils/logger";

export interface IActivityData {
    userId: string;
    username: string;
    managerId: string;
    activityType: 'TRAINING' | 'EVALUATION';
    metric: number;
    sessionTitle: string;
}

export interface IActivityRecords {
    activities: IActivity[];
    total: number;
    totalPages: number;
}

export const createActivityRecord = async (activityData: IActivityData) => {
    let content = "";
    if(activityData.activityType === 'TRAINING') {
    if (activityData.metric === 0) {
      content = 'Training started on "' + activityData.sessionTitle + '"';
    } else if (activityData.metric >= 100) {
      content = 'Training completed on "' + activityData.sessionTitle + '"';
    } else {
      content =
        "Training progress: " +
        activityData.metric +
        '% on "' +
        activityData.sessionTitle +
        '"';
    }
    }
    else if(activityData.activityType === 'EVALUATION') {
        content = 'Completed evaluation: ' + activityData.metric + '% on "' + activityData.sessionTitle + '"';
    }else {
        logger.error('Invalid activity type');
    }

    // Create activity record
    const activity: IActivity = new Activity({
      userId: activityData.userId,
      username: activityData.username,
      managerId: activityData.managerId,
      activityType: activityData.activityType,
      content: content,
    });
    await activity.save();
    return activity;
}

export const getActivityRecords = async (userId: string, limit: number = 10, page: number = 1): Promise<IActivityRecords> => {
    const user = await User.findById(userId);
    if(!user) {
        throw new AppError('User not found', 'USER_NOT_FOUND', 404);
    }
    if(user.role === 'manager' || user.role === 'admin') {
        const total = await Activity.countDocuments({ managerId: userId });
        const totalPages = Math.ceil(total / limit);
        const activities = await Activity.find({ managerId: userId }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
        return {
            activities,
            total,
            totalPages,
        };
    } else {
        const total = await Activity.countDocuments({ userId });
        const totalPages = Math.ceil(total / limit);
        const activities = await Activity.find({ userId }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
        return {
            activities,
            total,
            totalPages,
        };
    }
}




