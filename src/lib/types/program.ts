import { z } from 'zod';

export const ProgramSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    lead: z.string(),
    status: z.enum(["On Track", "At Risk", "Delayed", "Completed"]),
    deadline: z.string(),
    objectives: z.array(z.string()),
    valuePerObjective: z.number().optional(),
    createdAt: z.any().optional(),
});

export type Program = z.infer<typeof ProgramSchema>;
