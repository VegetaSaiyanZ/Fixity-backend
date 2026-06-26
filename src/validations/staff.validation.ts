import { z } from "zod";

// Validates the query parameter for listing staff — role must be "Manager" or "Worker".
export const ListStaffSchema = z.object({
  query: z.object({
    role: z.enum(["Manager", "Worker", "HR", "Official"]),
  }),
});

// Validates the request body for creating a new staff member.
export const CreateStaffSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email format"),
    role: z.enum(["Manager", "Worker"]),
  }),
});

export type CreateStaffDTO = z.infer<typeof CreateStaffSchema>["body"];
