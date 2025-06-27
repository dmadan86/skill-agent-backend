import { z } from "zod";

export const userActivitiesSchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => parseInt(val || "1")),
    limit: z.string().optional().transform(val => parseInt(val || "10")),
  }),
});

export const superAdminAnalyticsSchema = z.object({}); 