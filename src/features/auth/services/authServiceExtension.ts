// src/features/auth/services/authServiceExtensions.ts
import { TeamInvite } from "../../../shared/models/TeamInvite";
import { Team } from "../../../shared/models/Team";
import User from "../../../shared/models/User";
import { Types } from "mongoose";

/**
 * After a user registers or logs in via Google OAuth,
 * check if there are any pending team invites for their email
 * and associate them with the teams if invites are accepted.
 */
export const processTeamInvitesForUser = async (
  userId: string,
  email: string,
): Promise<void> => {
  // Find accepted invites for this email
  const acceptedInvites = await TeamInvite.find({
    email: email.toLowerCase(),
    status: "accepted",
  });

  if (acceptedInvites.length === 0) {
    return; // No accepted invites to process
  }

  // Get the teams from these invites
  const teamIds = acceptedInvites.map((invite) => invite.team);

  // Add user to each team
  for (const teamId of teamIds) {
    await Team.findByIdAndUpdate(teamId, {
      $addToSet: { members: new Types.ObjectId(userId) },
    });
  }

  // Add teams to user's teams array
  await User.findByIdAndUpdate(userId, {
    $addToSet: { teams: { $each: teamIds } },
  });

  // Mark invites as processed
  await TeamInvite.updateMany(
    { _id: { $in: acceptedInvites.map((invite) => invite._id) } },
    { $set: { status: "accepted" } },
  );
};
