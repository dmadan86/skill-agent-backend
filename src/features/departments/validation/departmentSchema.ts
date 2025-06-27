// src/features/departments/validation/departmentSchema.ts
import { z } from 'zod';

// Common schemas
const objectIdSchema = z.string({
  required_error: 'ID is required',
}).regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

// Create Department Schema
const createDepartmentSchema = z.object({
  name: z.string({
    required_error: 'Department name is required',
  }).min(3, 'Department name must be at least 3 characters').max(100),
  description: z.string().optional(),
  members: z.array(objectIdSchema).optional(),
});

// Update Department Schema
const updateDepartmentSchema = z.object({
  name: z.string().min(3, 'Department name must be at least 3 characters').max(100).optional(),
  description: z.string().optional(),
});

// Get Department Schema
const getDepartmentSchema = z.object({
  id: objectIdSchema,
});

// Delete Department Schema
const deleteDepartmentSchema = z.object({
  id: objectIdSchema,
});

// Member Management Schema
const memberManagementSchema = z.object({
  userIds: z.array(objectIdSchema, {
    required_error: 'User IDs are required',
  }).min(1, 'At least one user ID is required'),
});

// Export types for use in controllers
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type GetDepartmentInput = z.infer<typeof getDepartmentSchema>;
export type DeleteDepartmentInput = z.infer<typeof deleteDepartmentSchema>;
export type MemberManagementInput = z.infer<typeof memberManagementSchema>;

// Export schemas for validation middleware
export const departmentSchemas = {
  createDepartmentSchema: { body: createDepartmentSchema },
  updateDepartmentSchema: { 
    params: getDepartmentSchema,
    body: updateDepartmentSchema,
  },
  getDepartmentSchema: { params: getDepartmentSchema },
  deleteDepartmentSchema: { params: deleteDepartmentSchema },
  addMembersSchema: { 
    params: getDepartmentSchema,
    body: memberManagementSchema,
  },
  removeMembersSchema: { 
    params: getDepartmentSchema,
    body: memberManagementSchema,
  },
};