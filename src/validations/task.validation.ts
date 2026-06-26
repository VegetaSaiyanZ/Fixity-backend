import { z } from "zod";

export const CreateTaskSchema = z.object({
  body: z.object({
    incidentId: z.number().int().positive(),
    categoryId: z.number().int().positive(),
    workerNotes: z.string().optional(),
  }),
});

export const UpdateTaskStatusSchema = z.object({
  body: z.object({
    status: z.enum(["Open", "Assigned", "Closed", "open", "assigned", "closed"]).transform((val) => {
      const normalized = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
      return normalized as "Open" | "Assigned" | "Closed";
    }),
    cityResponse: z.string().optional(),
  }),
});

export const LinkTaskSchema = z.object({
  body: z.object({
    incidentId: z.number().int().positive(),
  }),
});

export type CreateTaskDTO = z.infer<typeof CreateTaskSchema>["body"];
export type UpdateTaskStatusDTO = z.infer<typeof UpdateTaskStatusSchema>["body"];
export type LinkTaskDTO = z.infer<typeof LinkTaskSchema>["body"];
