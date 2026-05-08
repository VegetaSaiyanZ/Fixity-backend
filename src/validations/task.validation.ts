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
    status: z.enum(["Closed"]),
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
