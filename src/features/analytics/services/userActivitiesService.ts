import Activity from "../../../shared/models/Activity";

export const getUserActivities = async (page: number, limit: number) => {
  try {
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      Activity.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "firstName lastName email")
        .populate("managerId", "firstName lastName email")
        .lean(),
      Activity.countDocuments(),
    ]);

    return {
      activities,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error in getUserActivities:", error);
    throw error;
  }
};
