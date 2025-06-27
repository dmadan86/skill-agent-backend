// src/features/teams/validation/teamSchema.ts
import { z } from 'zod';
import { Types } from 'mongoose';

// Helper function to validate MongoDB ObjectIds
const isValidObjectId = (value: string) => Types.ObjectId.isValid(value);

export const createTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(100, 'Team name is too long'),
  description: z.string().optional(),
});

export const updateTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(100, 'Team name is too long').optional(),
  description: z.string().optional(),
});

export const addTeamMemberSchema = z.object({
  userIds: z.array(z.string().refine(isValidObjectId, { message: 'Invalid user ID format' })),
});

export const bulkAddTeamMembersSchema = z.object({
  userIds: z.array(z.string().refine(isValidObjectId, { message: 'Invalid user ID format' })),
});

export const inviteToTeamSchema = z.object({
  emails: z.array(z.string().email('Invalid email address')),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1, 'Invitation token is required'),
});

// Send Member Reminder Schema
const sendMemberReminderSchema = z.object({
  teamId: z.string().min(1, "Team ID is required"),
  // memberId: z.string().min(1, "Member ID is required"),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type AddTeamMemberInput = z.infer<typeof addTeamMemberSchema>;
export type BulkAddTeamMembersInput = z.infer<typeof bulkAddTeamMembersSchema>;
export type InviteToTeamInput = z.infer<typeof inviteToTeamSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;

export const teamSchemas = {
    createTeamSchema: { body: createTeamSchema },
    updateTeamSchema: { body: updateTeamSchema },
    addTeamMemberSchema: { body: addTeamMemberSchema },
    bulkAddTeamMembersSchema: { body: bulkAddTeamMembersSchema },
    inviteToTeamSchema: { body: inviteToTeamSchema },
    acceptInviteSchema: { body: acceptInviteSchema },
    sendMemberReminderSchema,
}
