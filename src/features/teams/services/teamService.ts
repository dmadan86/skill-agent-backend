// src/features/teams/services/teamService.ts
import { Types } from "mongoose";
import { Team, ITeam } from "../../../shared/models/Team";
import User from "../../../shared/models/User";
import { TeamInvite, ITeamInvite } from "../../../shared/models/TeamInvite";
import {
  AppError,
  NotFoundError,
  UnauthorizedError,
} from "../../../shared/errors/AppError";
import { randomBytes } from "crypto";
import { promisify } from "util";
import { sendTeamInviteEmail } from "../../../shared/services/emailService";
import config from "../../../shared/config";
import logger from "../../../shared/utils/logger";
import { UserMetricActivityService } from "../../../shared/services/userMetricActivityService";

// We would need to implement an email service
// import { sendInvitationEmail } from '@/shared/services/emailService';

interface CreateTeamData {
  name: string;
  description?: string;
  owner: string;
}

interface UpdateTeamData {
  name?: string;
  description?: string;
}

export const createTeam = async (data: CreateTeamData): Promise<ITeam> => {
  const { name, description, owner } = data;

  // First check if the owner exists
  const userExists = await User.exists({ _id: owner });
  if (!userExists) {
    throw new NotFoundError("User not found");
  }

  // Create the team
  const team = new Team({
    name,
    description,
    owner: new Types.ObjectId(owner),
    members: [new Types.ObjectId(owner)], // Owner is also a member
  });

  await team.save();

  // Add the team to the user's teams
  await User.findByIdAndUpdate(owner, {
    $addToSet: { teams: team._id },
  });

  // Track team creation activity
  await UserMetricActivityService.createActivity({
    userId: owner,
    activityType: "team_created",
    feature: "teams",
    metadata: {
      teamId: (team._id as any).toString(),
      teamName: name,
      memberCount: 1,
    },
    status: "success",
  });

  return team;
};

export const getTeamById = async (
  teamId: string,
  userId: string,
): Promise<ITeam> => {
  const team = await Team.findById(teamId)
    .populate("owner", "firstName lastName email")
    .populate("members", "firstName lastName email");

  if (!team) {
    throw new NotFoundError("Team not found");
  }

  // Check if user is a member of the team
  const isMember = team.members.some((member) => {
    // Log team access check
    console.log(`Checking team access for user ${userId} on team ${teamId}`);
    console.log(`Team owner: ${team.owner.toString()}`);
    console.log(`Member: ${member.toString()}`);
    return (
      member._id.toString() === userId || team.owner._id.toString() === userId
    );
  });

  if (!isMember) {
    throw new UnauthorizedError("You do not have access to this team");
  }

  return team;
};

export const updateTeam = async (
  teamId: string,
  data: UpdateTeamData,
  userId: string,
): Promise<ITeam> => {
  const team = await Team.findById(teamId);

  if (!team) {
    throw new NotFoundError("Team not found");
  }

  // Check if user is the team owner
  if (team.owner.toString() !== userId) {
    throw new UnauthorizedError("Only the team owner can update the team");
  }

  // Update the team
  if (data.name) team.name = data.name;
  if (data.description !== undefined) team.description = data.description;

  await team.save();

  // Track team update activity
  await UserMetricActivityService.createActivity({
    userId,
    activityType: "team_updated",
    feature: "team",
    metadata: {
      teamId: (team._id as Types.ObjectId).toString(),
      teamName: team.name,
      changes: Object.keys(data),
    },
    status: "success",
  });

  return team;
};

export const deleteTeam = async (
  teamId: string,
  userId: string,
): Promise<void> => {
  const team = await Team.findById(teamId);

  if (!team) {
    throw new NotFoundError("Team not found");
  }

  // Check if user is the team owner
  if (team.owner.toString() !== userId) {
    throw new UnauthorizedError("Only the team owner can delete the team");
  }

  // Remove team references from all members
  await User.updateMany({ teams: team._id }, { $pull: { teams: team._id } });

  // Delete all pending invites for this team
  await TeamInvite.deleteMany({ team: team._id });

  // Delete the team
  await Team.findByIdAndDelete(teamId);

  // Track team deletion activity
  await UserMetricActivityService.createActivity({
    userId,
    activityType: "team_deleted",
    feature: "team",
    metadata: {
      teamId: (team._id as Types.ObjectId).toString(),
      teamName: team.name,
      memberCount: team.members.length,
    },
    status: "success",
  });
};

export const getAllTeamsForUser = async (userId: string): Promise<ITeam[]> => {
  // Find teams where the user is either a member or the owner
  const teams = await Team.find({
    $or: [{ members: userId }, { owner: userId }],
  }).populate("owner", "firstName lastName email");

  return teams;
};

export const addTeamMembers = async (
  teamId: string,
  userIds: string[],
  requesterId: string,
): Promise<{
  team: ITeam;
  results: {
    success: Array<{ userId: string; message: string }>;
    failure: Array<{ userId: string; error: string }>;
  };
}> => {
  const team = await Team.findById(teamId);

  if (!team) {
    throw new NotFoundError("Team not found");
  }

  if (team.owner.toString() !== requesterId) {
    throw new UnauthorizedError("Only the team owner can add members");
  }

  const existingUsers = await User.find({ _id: { $in: userIds } });
  const existingUserIdMap = new Map(
    existingUsers.map((user) => [user._id.toString(), user]),
  );

  const results = {
    success: [] as Array<{ userId: string; message: string }>,
    failure: [] as Array<{ userId: string; error: string }>,
  };

  const userIdsToAdd: string[] = [];

  for (const userId of userIds) {
    if (!existingUserIdMap.has(userId)) {
      results.failure.push({
        userId,
        error: "User not found",
      });
      continue;
    }

    if (team.members.some((member) => member.toString() === userId)) {
      results.failure.push({
        userId,
        error: "User is already a team member",
      });
      continue;
    }

    userIdsToAdd.push(userId);
    results.success.push({
      userId,
      message: "User added successfully",
    });
  }

  if (userIdsToAdd.length > 0) {
    userIdsToAdd.forEach((userId) => {
      team.members.push(new Types.ObjectId(userId));
    });

    await team.save();

    await User.updateMany(
      { _id: { $in: userIdsToAdd } },
      { $addToSet: { teams: team._id } },
    );

    // Track team members added activity
    await UserMetricActivityService.createActivity({
      userId: requesterId,
      activityType: "team_joined",
      feature: "teams",
      metadata: {
        teamId: (team._id as Types.ObjectId).toString(),
        teamName: team.name,
        addedMembers: userIdsToAdd,
        totalMembers: team.members.length,
      },
      status: "success",
    });
  }

  return { team, results };
};

export const removeTeamMembers = async (
  teamId: string,
  userIds: string[],
  requesterId: string,
): Promise<{
  team: ITeam;
  results: {
    success: Array<{ userId: string; message: string }>;
    failure: Array<{ userId: string; error: string }>;
  };
}> => {
  const team = await Team.findById(teamId);

  if (!team) {
    throw new NotFoundError("Team not found");
  }

  if (team.owner.toString() !== requesterId) {
    throw new UnauthorizedError("Only the team owner can remove members");
  }

  const results = {
    success: [] as Array<{ userId: string; message: string }>,
    failure: [] as Array<{ userId: string; error: string }>,
  };

  const userIdsToRemove: string[] = [];

  for (const userId of userIds) {
    if (userId === team.owner.toString()) {
      results.failure.push({
        userId,
        error: "Cannot remove the team owner",
      });
      continue;
    }

    if (!team.members.some((member) => member.toString() === userId)) {
      results.failure.push({
        userId,
        error: "User is not a team member",
      });
      continue;
    }

    userIdsToRemove.push(userId);
    results.success.push({
      userId,
      message: "User removed successfully",
    });
  }

  if (userIdsToRemove.length > 0) {
    team.members = team.members.filter(
      (member) => !userIdsToRemove.includes(member.toString()),
    );

    await team.save();

    await User.updateMany(
      { _id: { $in: userIdsToRemove } },
      { $pull: { teams: team._id } },
    );

    // Track team members removed activity
    await UserMetricActivityService.createActivity({
      userId: requesterId,
      activityType: "team_left",
      feature: "teams",
      metadata: {
        teamId: (team._id as Types.ObjectId).toString(),
        teamName: team.name,
        removedMembers: userIdsToRemove,
        totalMembers: team.members.length,
      },
      status: "success",
    });
  }

  return { team, results };
};

export const inviteToTeam = async (
  teamId: string,
  emails: string[],
  inviterId: string,
): Promise<{
  invitations: ITeamInvite[];
  results: {
    success: Array<{ email: string; message: string }>;
    failure: Array<{ email: string; error: string }>;
  };
}> => {
  logger.debug("inviterId: " + inviterId);
  const team = await Team.findById(teamId);

  if (!team) {
    throw new NotFoundError("Team not found");
  }

  if (team.owner.toString() !== inviterId) {
    throw new UnauthorizedError("Only the team owner can send invitations");
  }

  // Get the inviter to check organization membership
  const inviter = await User.findById(inviterId);
  if (!inviter) {
    throw new NotFoundError("Inviter not found");
  }

  const normalizedEmails = emails.map((email) => email.toLowerCase());

  const existingInvites = await TeamInvite.find({
    email: { $in: normalizedEmails },
    team: team._id,
    status: "pending",
  });

  const emailsWithPendingInvites = new Set(
    existingInvites.map((invite) => invite.email),
  );

  const existingUsers = await User.find({
    email: { $in: normalizedEmails },
  });

  const emailToUserMap = new Map(
    existingUsers.map((user) => [user.email, user]),
  );

  const results = {
    success: [] as Array<{ email: string; message: string }>,
    failure: [] as Array<{ email: string; error: string }>,
  };

  const invitationsToCreate: Array<{
    email: string;
    team: Types.ObjectId;
    invitedBy: Types.ObjectId;
    token: string;
    expiresAt: Date;
    status: "pending";
  }> = [];

  for (const email of normalizedEmails) {
    if (emailsWithPendingInvites.has(email)) {
      logger.info(
        "An invitation has already been sent to this email: " + email,
      );
      results.failure.push({
        email,
        error: "An invitation has already been sent to this email",
      });
      continue;
    }

    const existingUser = emailToUserMap.get(email);

    // Check if user exists
    if (!existingUser) {
      logger.info("User does not exist: " + email);
      results.failure.push({
        email,
        error: "User is not part of your organization",
      });
      continue;
    }

    // Check if user is already a team member
    if (
      team.members.some(
        (member) => member.toString() === existingUser._id.toString(),
      )
    ) {
      logger.info("User is already a team member: " + email);
      results.failure.push({
        email,
        error: "User is already a team member",
      });
      continue;
    }

    // Check if user is in the same organization as the inviter
    if (
      existingUser.managedBy &&
      inviter.managedBy &&
      existingUser.managedBy.toString() !== inviter.managedBy.toString()
    ) {
      logger.info("User is not part of the organization: " + email);
      results.failure.push({
        email,
        error: "User is not part of your organization",
      });
      continue;
    }

    // Generate invitation token asynchronously and securely
    let token: string;
    try {
      const buffer = await promisify(randomBytes)(32);
      token = buffer.toString("hex");

      // Check for potential collisions (extremely unlikely but best practice)
      const existingTokenCount = await TeamInvite.countDocuments({
        token,
        status: "pending",
      });

      if (existingTokenCount > 0) {
        const newBuffer = await promisify(randomBytes)(32);
        token = newBuffer.toString("hex");
      }
    } catch (error) {
      logger.error("Failed to create secure invitation", error);
      throw new AppError(
        "Failed to create secure invitation",
        "INVITE_GENERATION_FAILED",
        500,
      );
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    invitationsToCreate.push({
      email,
      team: team._id as Types.ObjectId,
      invitedBy: new Types.ObjectId(inviterId),
      token,
      expiresAt,
      status: "pending",
    });

    results.success.push({
      email,
      message: "Invitation sent successfully",
    });
  }

  // Create invitations in batch if any
  const createdInvitations: ITeamInvite[] = [];
  if (invitationsToCreate.length > 0) {
    const newInvitations = await TeamInvite.insertMany(invitationsToCreate);
    createdInvitations.push(...newInvitations);

    for (const invitation of invitationsToCreate) {
      logger.debug("invitation: " + JSON.stringify(invitation));
      sendTeamInviteEmail(
        invitation.email,
        team.name,
        inviter ? inviter.firstName : "Digital Agents",
        `${config.frontendUrl}/dashboard/my-teams?token=${invitation.token}`,
      ).then((sent) => {
        if (!sent) {
          logger.error("Failed to send invitation email", invitation.email);
        } else {
          logger.info("Invitation email sent successfully", invitation.email);
        }
        logger.debug("sent: " + sent);
      });
    }
  }

  return { invitations: createdInvitations, results };
};

export const acceptInvite = async (
  token: string,
): Promise<{ team: ITeam; userId?: string }> => {
  const invitation = await TeamInvite.findOne({
    token,
    status: "pending",
    expiresAt: { $gt: new Date() }, // Not expired
  });

  if (!invitation) {
    throw new NotFoundError("Invitation not found or has expired");
  }

  const user = await User.findOne({ email: invitation.email });

  if (user) {
    await Team.findByIdAndUpdate(invitation.team, {
      $addToSet: { members: user._id },
    });

    await User.findByIdAndUpdate(user._id, {
      $addToSet: { teams: invitation.team },
    });

    invitation.status = "accepted";
    await invitation.save();

    const team = await Team.findById(invitation.team);
    if (!team) {
      throw new NotFoundError("Team not found");
    }

    return { team, userId: user._id.toString() };
  } else {
    // User doesn't exist yet, just mark the invitation as accepted
    // The user will be added to the team when they register
    invitation.status = "accepted";
    await invitation.save();

    const team = await Team.findById(invitation.team);
    if (!team) {
      throw new NotFoundError("Team not found");
    }

    return { team };
  }
};

export const rejectInvite = async (token: string): Promise<void> => {
  const invitation = await TeamInvite.findOne({
    token,
    status: "pending",
  });

  if (!invitation) {
    throw new NotFoundError("Invitation not found");
  }

  invitation.status = "rejected";
  await invitation.save();
};

export const getTeamInvites = async (
  teamId: string,
  requesterId: string,
  query: any,
): Promise<ITeamInvite[]> => {
  const team = await Team.findById(teamId);

  if (!team) {
    throw new NotFoundError("Team not found");
  }

  if (team.owner.toString() !== requesterId) {
    throw new UnauthorizedError("Only the team owner can view invitations");
  }

  const invites = await TeamInvite.find({
    team: team._id,
    ...query,
  }).sort({ createdAt: -1 });

  return invites;
};

export const getUserInvites = async (
  userId: string,
): Promise<ITeamInvite[]> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  const invites = await TeamInvite.find({
    email: user.email,
    status: "pending",
    expiresAt: { $gt: new Date() }, // Not expired
  })
    .populate("team", "name description")
    .populate("invitedBy", "firstName lastName email");

  return invites;
};

export const cancelInvite = async (
  inviteId: string,
  requesterId: string,
): Promise<void> => {
  const invite = await TeamInvite.findById(inviteId);

  if (!invite) {
    throw new NotFoundError("Invitation not found");
  }

  const team = await Team.findById(invite.team);
  if (!team) {
    throw new NotFoundError("Team not found");
  }

  // Check if requester is the team owner
  if (team.owner.toString() !== requesterId) {
    throw new UnauthorizedError("Only the team owner can cancel invitations");
  }

  // Delete the invitation
  await TeamInvite.findByIdAndDelete(inviteId);
};

export const getUser = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  return user;
};
