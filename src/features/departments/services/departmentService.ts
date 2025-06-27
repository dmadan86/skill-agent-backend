// src/features/departments/services/departmentService.ts
import mongoose from "mongoose";
import { Department, IDepartment } from "../../../shared/models/Department";
import User from "../../../shared/models/User";
import { DepartmentNotFoundError } from "../../../shared/errors/TrainingErrors";
import { AppError, ForbiddenError } from "../../../shared/errors/AppError";
import { useWebhookTrigger } from "../../../shared/services/webhookService";

interface CreateDepartmentData {
  name: string;
  description?: string;
  manager: mongoose.Types.ObjectId;
  members?: mongoose.Types.ObjectId[];
}

interface UpdateDepartmentData {
  name?: string;
  description?: string;
}

/**
 * Create a new department
 */
export const createDepartment = async (
  data: CreateDepartmentData
): Promise<IDepartment> => {
  // Check if department with same name already exists
  // const existingDepartment = await Department.findOne({ name: data.name });
  // if (existingDepartment) {
  //   throw new AppError(
  //     "Department with this name already exists",
  //     "DEPARTMENT_NAME_EXISTS",
  //     409
  //   );
  // }

  // Initialize with manager as a member if not specified
  const members = data.members || [data.manager];

  // Ensure manager is in members list
  if (!members.some((id) => id.equals(data.manager))) {
    members.push(data.manager);
  }

  // Create department
  const department = new Department({
    name: data.name,
    description: data.description,
    manager: data.manager,
    members,
  });

  const departmentSaved = await department.save();
  await useWebhookTrigger("team.created", departmentSaved, data.manager.toString());
  return departmentSaved;
};

/**
 * Update an existing department
 */
export const updateDepartment = async (
  id: string,
  userId: mongoose.Types.ObjectId,
  data: UpdateDepartmentData
): Promise<IDepartment> => {
  const department = await Department.findById(id);

  if (!department) {
    throw new DepartmentNotFoundError();
  }

  // Check if user is the manager
  if (!department.manager.equals(userId)) {
    throw new ForbiddenError(
      "Only the department manager can update the department"
    );
  }

  // // Check if name is being changed and already exists
  // if (data.name && data.name !== department.name) {
  //   const existingDepartment = await Department.findOne({ name: data.name });
  //   if (existingDepartment) {
  //     throw new AppError(
  //       "Department with this name already exists",
  //       "DEPARTMENT_NAME_EXISTS",
  //       409
  //     );
  //   }
  // }

  // Apply updates
  Object.assign(department, data);
  const departmentSaved = await department.save();
  await useWebhookTrigger("team.updated", departmentSaved, userId.toString());
  return departmentSaved;
};

/**
 * Get a department by ID
 */
export const getDepartmentById = async (id: string): Promise<IDepartment> => {
  const department = await Department.findById(id)
    .populate("manager", "firstName lastName email")
    .populate("members", "firstName lastName email position");

  if (!department) {
    throw new DepartmentNotFoundError();
  }

  return department;
};

/**
 * Delete a department
 */
export const deleteDepartment = async (
  id: string,
  userId: mongoose.Types.ObjectId
): Promise<void> => {
  const department = await Department.findById(id);

  if (!department) {
    throw new DepartmentNotFoundError();
  }

  // Check if user is the manager
  if (!department.manager.equals(userId)) {
    throw new ForbiddenError(
      "Only the department manager can delete the department"
    );
  }

  await Department.findByIdAndDelete(id);
  await useWebhookTrigger("team.deleted", department, userId.toString());
};

/**
 * List all departments accessible to a user
 */
export const listDepartments = async (
  userId: mongoose.Types.ObjectId
): Promise<IDepartment[]> => {
  // Get departments where user is manager
  const user = await User.findById(userId);
      
  if (!user) {
    throw new AppError("User not found", "USER_NOT_FOUND", 404);
  }

  // let query = {manager: user.managedBy};
  // const managedDepartments = await Department.find(query)
  //   .populate("manager", "firstName lastName email")
  //   .populate("members", "firstName lastName email position role")
  //   .sort({ name: 1 });

  const ownedDepartments = await Department.find({ manager: userId })
    .populate("manager", "firstName lastName email")
    .populate("members", "firstName lastName email position role")
    .sort({ name: 1 });

  const allDepartments = ownedDepartments;


  // If user is superadmin, return all departments
  if (user.role === "superadmin") {
    return Department.find()
      .populate("manager", "firstName lastName email")
      .populate("members", "firstName lastName email position role")
      .sort({ name: 1 });
  }

  // Return managed departments
  return allDepartments;
};

/**
 * Add members to a department
 */
export const addDepartmentMembers = async (
  id: string,
  userId: mongoose.Types.ObjectId,
  memberIds: string[]
): Promise<IDepartment> => {
  const department = await Department.findById(id);

  if (!department) {
    throw new DepartmentNotFoundError();
  }

  // Check if user is the manager
  if (!department.manager.equals(userId)) {
    throw new ForbiddenError("Only the department manager can add members");
  }

  // Verify all users exist
  for (const memberId of memberIds) {
    const userExists = await User.exists({ _id: memberId });
    if (!userExists) {
      throw new AppError(
        `User with ID ${memberId} not found`,
        "USER_NOT_FOUND",
        404
      );
    }
  }

  // Add members that don't already exist in the department
  const existingMemberIds = department.members.map((m) => m.toString());
  const newMembers = memberIds.filter((id) => !existingMemberIds.includes(id));

  if (newMembers.length > 0) {
    department.members.push(
      ...newMembers.map((id) => new mongoose.Types.ObjectId(id))
    );
    await department.save();
  }

  return getDepartmentById(id); // Return populated department
};

/**
 * Remove members from a department
 */
export const removeDepartmentMembers = async (
  id: string,
  userId: mongoose.Types.ObjectId,
  memberIds: string[]
): Promise<IDepartment> => {
  const department = await Department.findById(id);

  if (!department) {
    throw new DepartmentNotFoundError();
  }

  // Check if user is the manager
  if (!department.manager.equals(userId)) {
    throw new ForbiddenError("Only the department manager can remove members");
  }

  // Prevent removing the manager from members
  if (memberIds.includes(department.manager.toString())) {
    throw new AppError(
      "Cannot remove the department manager from members",
      "CANNOT_REMOVE_MANAGER",
      400
    );
  }

  // Remove specified members
  department.members = department.members.filter(
    (memberId) => !memberIds.includes(memberId.toString())
  );

  await department.save();

  return getDepartmentById(id); // Return populated department
};

/**
 * Get all members of a department
 */
export const getDepartmentMembers = async (id: string): Promise<any[]> => {
  const department = await Department.findById(id).populate(
    "members",
    "firstName lastName email position department role"
  );

  if (!department) {
    throw new DepartmentNotFoundError();
  }

  return department.members;
};
