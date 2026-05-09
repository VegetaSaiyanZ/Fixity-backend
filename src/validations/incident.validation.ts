import { z } from "zod";

export const CreateIncidentSchema = z.object({
  body: z.object({
    description: z.string().optional(),
    reportIds: z.array(z.number().int().positive()).min(1, "At least one report must be selected"),
  }),
});

export type CreateIncidentDTO = z.infer<typeof CreateIncidentSchema>["body"];
