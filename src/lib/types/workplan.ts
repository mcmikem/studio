import { z } from 'zod';

export const TeamWeeklyPlanSchema = z.object({
    id: z.string(),
    weekOf: z.any(),
    keyPriorities: z.array(z.object({
        activity: z.string(),
        priority: z.enum(['High', 'Medium', 'Low']),
        responsible: z.array(z.string()),
        deadline: z.any().optional(),
    })),
    message: z.string(),
    authorId: z.string(),
    authorName: z.string(),
    status: z.enum(['Draft', 'Published']),
    createdAt: z.any(),
});
export type TeamWeeklyPlan = z.infer<typeof TeamWeeklyPlanSchema>;

export const WeeklyWorkplanSchema = z.object({
    id: z.string(),
    userId: z.string(),
    userName: z.string(),
    weekOf: z.any(),
    teamPlanId: z.string().optional(),
    teamPriorities: z.array(z.object({
        activity: z.string(),
        priority: z.enum(['High', 'Medium', 'Low']),
        responsible: z.array(z.string()),
        deadline: z.any().optional(),
    })).optional(),
    individualTasks: z.array(z.string()),
    createdAt: z.any(),
});
export type WeeklyWorkplan = z.infer<typeof WeeklyWorkplanSchema>;

export const PriorityItemSchema = z.object({
  activity: z.string(),
  priority: z.enum(['High', 'Medium', 'Low']),
  responsible: z.array(z.string()),
  deadline: z.any().optional(),
});
export type PriorityItem = z.infer<typeof PriorityItemSchema>;
