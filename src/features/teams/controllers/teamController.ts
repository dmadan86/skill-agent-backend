// src/features/teams/controllers/teamController.ts
import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../../shared/middleware/authenticate";
import * as teamService from "../services/teamService";
import * as bulkImportService from "../services/bulkImportService";
import { sendSuccess } from "../../../shared/utils/response.utils";
import { AppError } from "../../../shared/errors/AppError";
import {
  CreateTeamInput,
  UpdateTeamInput,
  AddTeamMemberInput as TeamMembersInput,
  InviteToTeamInput,
  AcceptInviteInput,
} from "../validation/teamSchema";
import logger from "../../../shared/utils/logger";

export const createTeam = async (
  req: AuthenticatedRequest<{}, {}, CreateTeamInput>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { name, description } = req.body;
    const team = await teamService.createTeam({
      name,
      description,
      owner: req.user.userId,
    });

    sendSuccess(res, team, 201);
  } catch (error) {
    next(error);
  }
};

export const getTeam = async (
  req: AuthenticatedRequest<{ teamId: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { teamId } = req.params;
    const team = await teamService.getTeamById(teamId, req.user.userId);

    sendSuccess(res, team);
  } catch (error) {
    next(error);
  }
};

export const updateTeam = async (
  req: AuthenticatedRequest<{ teamId: string }, {}, UpdateTeamInput>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { teamId } = req.params;
    const { name, description } = req.body;
    const team = await teamService.updateTeam(
      teamId,
      { name, description },
      req.user.userId,
    );

    sendSuccess(res, team);
  } catch (error) {
    next(error);
  }
};

export const deleteTeam = async (
  req: AuthenticatedRequest<{ teamId: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { teamId } = req.params;
    await teamService.deleteTeam(teamId, req.user.userId);

    sendSuccess(res, { message: "Team deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const getAllTeams = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const teams = await teamService.getAllTeamsForUser(req.user.userId);

    sendSuccess(res, teams);
  } catch (error) {
    next(error);
  }
};

export const addTeamMembers = async (
  req: AuthenticatedRequest<{ teamId: string }, {}, TeamMembersInput>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { teamId } = req.params;
    const { userIds } = req.body;
    const team = await teamService.addTeamMembers(
      teamId,
      userIds,
      req.user.userId,
    );

    sendSuccess(res, team);
  } catch (error) {
    next(error);
  }
};

export const removeTeamMembers = async (
  req: AuthenticatedRequest<{ teamId: string }, {}, TeamMembersInput>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { teamId } = req.params;
    const { userIds } = req.body;
    const team = await teamService.removeTeamMembers(
      teamId,
      userIds,
      req.user.userId,
    );

    sendSuccess(res, team);
  } catch (error) {
    next(error);
  }
};

export const inviteToTeam = async (
  req: AuthenticatedRequest<{ teamId: string }, {}, InviteToTeamInput>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { teamId } = req.params;
    const { emails } = req.body;
    logger.debug(
      `emails: ${JSON.stringify({
        teamId,
        emails,
        userId: req.user.userId,
      })}`,
    );
    const invitation = await teamService.inviteToTeam(
      teamId,
      emails,
      req.user.userId,
    );

    sendSuccess(res, invitation);
  } catch (error) {
    next(error);
  }
};

export const acceptInvite = async (
  req: Request<{}, {}, AcceptInviteInput>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { token } = req.body;
    const result = await teamService.acceptInvite(token);

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const rejectInvite = async (
  req: Request<{}, {}, AcceptInviteInput>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { token } = req.body;
    await teamService.rejectInvite(token);

    sendSuccess(res, { message: "Invitation rejected successfully" });
  } catch (error) {
    next(error);
  }
};

export const getTeamInvites = async (
  req: AuthenticatedRequest<{ teamId: string }, {}, {}, { status: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    let query = {};

    const { teamId } = req.params;
    const { status } = req.query;
    if (status) query = { status: status };
    const invites = await teamService.getTeamInvites(
      teamId,
      req.user.userId,
      query,
    );

    sendSuccess(res, invites);
  } catch (error) {
    next(error);
  }
};

export const getUserInvites = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const invites = await teamService.getUserInvites(req.user.userId);

    sendSuccess(res, invites);
  } catch (error) {
    next(error);
  }
};

export const cancelInvite = async (
  req: AuthenticatedRequest<{ inviteId: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { inviteId } = req.params;
    await teamService.cancelInvite(inviteId, req.user.userId);

    sendSuccess(res, { message: "Invitation cancelled successfully" });
  } catch (error) {
    next(error);
  }
};

export const bulkImportMembers = async (
  req: AuthenticatedRequest<{ teamId: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    if (!req.file) {
      throw new AppError("CSV file is required", "FILE_REQUIRED", 400);
    }

    const { teamId } = req.params;
    const csvContent = req.file.buffer.toString("utf-8");

    const result = await bulkImportService.bulkImportTeamMembers(
      teamId,
      csvContent,
      req.user.userId,
    );

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const downloadImportTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const template = bulkImportService.generateImportTemplate();

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=team-import-template.csv",
    );
    res.send(template);
  } catch (error) {
    next(error);
  }
};

export const sendMemberReminder = async (
  req: AuthenticatedRequest<{ userId: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { userId } = req.params;
    console.log("req.params", req.params);

    // logger.debug("Sending reminder", { teamId, memberId, userId: req.user.userId });

    // await teamService.sendMemberReminder(teamId, memberId, req.user.userId);

    sendSuccess(res, {
      message: "Member reminder sent successfully",
    });
  } catch (error) {
    next(error);
  }
};
