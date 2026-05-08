import { z } from "zod";

// Provides Zod schemas for the Report endpoints, ensuring that creating and updating reports
// only accepts valid, properly-typed payload fields.
export const CreateReportSchema = z.object({
  body: z.object({
    categoryId: z.number().int().positive(),
    description: z.string().optional(),
    latitude: z.number(),
    longitude: z.number(),
    beforeImageUrl: z.string().url().optional().or(z.literal("")),
  }),
});

export const UpdateReportSchema = z.object({
  body: z.object({
    status: z.enum(["Open", "InProgress", "Resolved", "Closed"]),
  }),
});

export type CreateReportDTO = z.infer<typeof CreateReportSchema>["body"];
export type UpdateReportDTO = z.infer<typeof UpdateReportSchema>["body"];
