import { Response, NextFunction } from "express";
import mongoose from 'mongoose';
import * as billingPlanService from "../services/billingPlanService";
import { sendSuccess } from "../../../shared/utils/response.utils";
import { AuthenticatedRequest } from "../../../shared/middleware/authenticate";
import { AppError } from "../../../shared/errors/AppError";
import {
  CreateBillingPlanInput,
  UpdateBillingPlanInput,
} from "../validation/billingSchema";

/**
 * Create a new billing plan
 * @restricted Admin only
 */
export const createBillingPlan = async (
  req: AuthenticatedRequest<{}, {}, CreateBillingPlanInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    if (req.user.role !== "superadmin") {
      throw new AppError("Superadmin access required", "SUPERADMIN_REQUIRED", 403);
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const planData = req.body;
    
    const plan = await billingPlanService.createBillingPlan(planData, userId);

    sendSuccess(res, {
      message: "Billing plan created successfully",
      data: plan,
    }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing billing plan
 * @restricted Superadmin only
 */
export const updateBillingPlan = async (
  req: AuthenticatedRequest<{ id: string }, {}, UpdateBillingPlanInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    if (req.user.role !== "superadmin") {
      throw new AppError("Superadmin access required", "SUPERADMIN_REQUIRED", 403);
    }

    const { id } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    
    const plan = await billingPlanService.updateBillingPlan(id, req.body, userId);
    
    sendSuccess(res, {
      message: "Billing plan updated successfully",
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a billing plan by ID
 */
export const getBillingPlan = async (
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {

    const { id } = req.params;
    
    const plan = await billingPlanService.getBillingPlanById(id);
    
    sendSuccess(res, {
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a billing plan
 * @restricted Admin only
 */
export const deleteBillingPlan = async (
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", "AUTH_REQUIRED", 401);
    }

    // Check if user is admin
    if (req.user.role !== "admin") {
      throw new AppError("Admin access required", "ADMIN_REQUIRED", 403);
    }

    const { id } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    
    await billingPlanService.deleteBillingPlan(id, userId);
    
    sendSuccess(res, {
      message: "Billing plan deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List billing plans with pagination and filtering
 */
export const listBillingPlans = async (
  req: AuthenticatedRequest<{}, {}, {}, { page?: string; limit?: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
    
    const result = await billingPlanService.listBillingPlans({
      page,
      limit,
    });
    
    sendSuccess(res, {
      data: result,
    });
  } catch (error) {
    next(error);
  }
}; 