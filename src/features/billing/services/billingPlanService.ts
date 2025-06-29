import mongoose from "mongoose";
import { BillingPlan, IBillingPlan } from "../../../shared/models/BillingPlan";
import {
  BillingPlanNotFoundError,
  BillingPlanExistsError,
} from "../../../shared/errors/BillingErrors";
import { AppError } from "../../../shared/errors/AppError";
import { dbLogger } from "../../../shared/utils/loggerUtils";
import {
  CreateBillingPlanInput,
  UpdateBillingPlanInput,
} from "../validation/billingSchema";

interface ListBillingPlansOptions {
  page?: number;
  limit?: number;
}

/**
 * Create a new billing plan
 */
export const createBillingPlan = async (
  data: CreateBillingPlanInput,
  userId: mongoose.Types.ObjectId,
): Promise<IBillingPlan> => {
  try {
    const existingPlan = await BillingPlan.findOne({ name: data.name });
    if (existingPlan) {
      throw new BillingPlanExistsError();
    }

    const plan = new BillingPlan(data);
    const savedPlan = await plan.save();

    dbLogger.query("BillingPlan", "create", {
      planId: savedPlan._id,
      createdBy: userId,
    });

    return savedPlan;
  } catch (error) {
    dbLogger.error("BillingPlan", "create", error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      "Failed to create billing plan",
      "BILLING_PLAN_CREATE_ERROR",
      500,
    );
  }
};

/**
 * Update an existing billing plan
 */
export const updateBillingPlan = async (
  id: string,
  data: UpdateBillingPlanInput,
  userId: mongoose.Types.ObjectId,
): Promise<IBillingPlan> => {
  try {
    // Check if the plan exists
    const plan = await BillingPlan.findById(id);
    if (!plan) {
      throw new BillingPlanNotFoundError();
    }

    // If name is being updated, check if it's already in use
    if (data.name && data.name !== plan.name) {
      const existingPlan = await BillingPlan.findOne({ name: data.name });
      if (existingPlan) {
        throw new BillingPlanExistsError();
      }
    }

    // Apply updates
    Object.assign(plan, data);
    const updatedPlan = await plan.save();

    dbLogger.query("BillingPlan", "update", {
      planId: updatedPlan._id,
      updatedBy: userId,
    });

    return updatedPlan;
  } catch (error) {
    dbLogger.error("BillingPlan", "update", error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      "Failed to update billing plan",
      "BILLING_PLAN_UPDATE_ERROR",
      500,
    );
  }
};

/**
 * Get a billing plan by ID
 */
export const getBillingPlanById = async (id: string): Promise<IBillingPlan> => {
  try {
    const plan = await BillingPlan.findById(id);
    if (!plan) {
      throw new BillingPlanNotFoundError();
    }

    dbLogger.query("BillingPlan", "getById", { planId: id });
    return plan;
  } catch (error) {
    dbLogger.error("BillingPlan", "getById", error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      "Failed to get billing plan",
      "BILLING_PLAN_GET_ERROR",
      500,
    );
  }
};

/**
 * Delete a billing plan
 */
export const deleteBillingPlan = async (
  id: string,
  userId: mongoose.Types.ObjectId,
): Promise<void> => {
  try {
    const plan = await BillingPlan.findById(id);
    if (!plan) {
      throw new BillingPlanNotFoundError();
    }

    // Delete the plan
    await BillingPlan.findByIdAndDelete(id);

    dbLogger.query("BillingPlan", "delete", {
      planId: id,
      deletedBy: userId,
    });
  } catch (error) {
    dbLogger.error("BillingPlan", "delete", error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      "Failed to delete billing plan",
      "BILLING_PLAN_DELETE_ERROR",
      500,
    );
  }
};

/**
 * List billing plans with pagination and filtering
 */
export const listBillingPlans = async (
  options: ListBillingPlansOptions = {},
): Promise<{
  plans: IBillingPlan[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  try {
    const page = options.page ?? 1;
    const limit = options.limit ?? 10;
    const skip = (page - 1) * limit;

    // Execute query
    const [plans, total] = await Promise.all([
      BillingPlan.find().skip(skip).limit(limit),
      BillingPlan.countDocuments(),
    ]);

    const totalPages = Math.ceil(total / limit);

    dbLogger.query("BillingPlan", "list", {
      page,
      limit,
      total,
    });

    return {
      plans,
      total,
      page,
      limit,
      totalPages,
    };
  } catch (error) {
    dbLogger.error("BillingPlan", "list", error);
    throw new AppError(
      "Failed to list billing plans",
      "BILLING_PLAN_LIST_ERROR",
      500,
    );
  }
};
