import { AppError } from "../../../shared/errors/AppError";
import User from "../../../shared/models/User";
import { getCallDetails } from "../../../shared/services/retellAgentService";
import { UserMetricActivityService } from "../../../shared/services/userMetricActivityService";

export const updateUsage = async (userId: string, callId: string) => {
  const { transcript, timeSpent } = await getCallDetails(callId);

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", "USER_NOT_FOUND", 404);
  }

  // Track quick prep usage activity
  await UserMetricActivityService.createActivity({
    userId,
    activityType: "quickprep_completed",
    feature: "quickprep",
    metadata: {
      callId,
      timeSpent,
      transcriptLength: transcript?.length || 0,
    },
    status: "success",
    duration: timeSpent,
  });
};
