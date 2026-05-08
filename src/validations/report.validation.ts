import { z } from "zod";

// Provides Zod schemas for the Report endpoints, ensuring that creating and updating reports
// only accepts valid, properly-typed payload fields.
export const CreateReportSchema = z.object({
  body: z.object({
    requesterId: z.number().int().positive().optional(),
    categoryId: z.number().int().positive(),
    cityId: z.number().int().positive(),
    description: z.string().optional(),
    latitude: z.number(),
    longitude: z.number(),
    beforeImageUrl: z.string().url().optional().or(z.literal("")),
  }),
});

export const UpdateReportSchema = z.object({
  body: z.object({
    categoryId: z.number().int().positive().optional(),
    cityId: z.number().int().positive().optional(),
    description: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    beforeImageUrl: z.string().url().optional().or(z.literal("")),
    status: z.enum(["Open", "InProgress", "Resolved", "Closed"]).optional(),
  }),
});

export type CreateReportDTO = z.infer<typeof CreateReportSchema>["body"];
export type UpdateReportDTO = z.infer<typeof UpdateReportSchema>["body"];
