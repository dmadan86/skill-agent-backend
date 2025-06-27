import { z } from 'zod';

// Recent Activities Schema
const recentActivitiesSchema = z.object({
  teamId: z.string().optional(),
  limit: z.string().optional().transform(val => (val ? parseInt(val, 10) : 10)),
  page: z.string().optional().transform(val => (val ? parseInt(val, 10) : 1)),
});

// Export types for use in controllers
export type RecentActivitiesInput = z.infer<typeof recentActivitiesSchema>;

// Export schemas for validation middleware
export const dashboardSchemas = {
  recentActivitiesSchema: { 
    query: recentActivitiesSchema
  },
};
