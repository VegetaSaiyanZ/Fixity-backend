import { z } from "zod";

// Contains Zod validation schemas for user profile operations,
// ensuring updates include only allowed fields like firstName, lastName, and cityId.
export const UpdateUserSchema = z.object({
  body: z
    .object({
      firstName: z.string().min(1, "First name cannot be empty").optional(),
      lastName: z.string().min(1, "Last name cannot be empty").optional(),
      cityId: z.number().int().positive("Invalid city ID").optional(),
      profilePictureUrl: z.string().url().or(z.string().nullable()).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "No fields to update",
    }),
});

export type UpdateUserDTO = z.infer<typeof UpdateUserSchema>["body"];
