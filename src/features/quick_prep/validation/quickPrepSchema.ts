import { z } from "zod";

const updateQuickPrepUsageSchema = z.object({
  callId: z.string({
    required_error: "Call ID is required",
  }),
});

export type UpdateQuickPrepUsageSchema = z.infer<
  typeof updateQuickPrepUsageSchema
>;

export const quickPrepSchemas = {
  updateUsageSchema: { body: updateQuickPrepUsageSchema },
};
