// src/features/departments/controllers/departmentController.ts
import { Response, NextFunction } from "express";
import mongoose from "mongoose";
import * as departmentService from "../services/departmentService";
import { sendSuccess } from "../../../shared/utils/response.utils";
import { AuthenticatedRequest } from "../../../shared/middleware/authenticate";
import { AppError } from "../../../shared/errors/AppError";
import {
  CreateDepartmentInput,
  UpdateDepartmentInput,
  MemberManagementInput,
} from "../validation/departmentSchema";

/**
 * Create a new department
 */
export const createDepartment = async (
  req: AuthenticatedRequest<{}, {}, CreateDepartmentInput>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const departmentData = {
      ...req.body,
      manager: userId, // Current user becomes the manager
    };

    // We need to convert string[] to mongoose.Types.ObjectId[] for members
    const typedDepartmentData = {
      name: departmentData.name,
      description: departmentData.description,
      manager: departmentData.manager,
      members: departmentData.members
        ? departmentData.members.map((id) => new mongoose.Types.ObjectId(id))
        : undefined,
    };

    const department =
      await departmentService.createDepartment(typedDepartmentData);

    sendSuccess(
      res,
      {
        message: "Department created successfully",
        data: department,
      },
      201,
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing department
 */
export const updateDepartment = async (
  req: AuthenticatedRequest<{ id: string }, {}, UpdateDepartmentInput>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { id } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const department = await departmentService.updateDepartment(
      id,
      userId,
      req.body,
    );

    sendSuccess(res, {
      message: "Department updated successfully",
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a department by ID
 */
export const getDepartment = async (
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { id } = req.params;

    const department = await departmentService.getDepartmentById(id);

    sendSuccess(res, {
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a department
 */
export const deleteDepartment = async (
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { id } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user.userId);

    await departmentService.deleteDepartment(id, userId);

    sendSuccess(res, {
      message: "Department deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all departments
 */
export const listDepartments = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const departments = await departmentService.listDepartments(userId);

    sendSuccess(res, {
      data: departments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add members to a department
 */
export const addMembers = async (
  req: AuthenticatedRequest<{ id: string }, {}, MemberManagementInput>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { id } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const { userIds } = req.body;

    const department = await departmentService.addDepartmentMembers(
      id,
      userId,
      userIds,
    );

    sendSuccess(res, {
      message: "Members added to department successfully",
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove members from a department
 */
export const removeMembers = async (
  req: AuthenticatedRequest<{ id: string }, {}, MemberManagementInput>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { id } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const { userIds } = req.body;

    const department = await departmentService.removeDepartmentMembers(
      id,
      userId,
      userIds,
    );

    sendSuccess(res, {
      message: "Members removed from department successfully",
      data: department,
    });
  } catch (error) {
    next(error);
  }
};
