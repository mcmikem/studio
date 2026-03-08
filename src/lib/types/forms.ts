import { z } from 'zod';

export const SystemFeedbackSchema = z.object({
    id: z.string(),
    type: z.enum(['Bug', 'Feature', 'Feedback']),
    priority: z.enum(['High', 'Medium', 'Low']).optional(),
    title: z.string().min(5, "Please provide a short title."),
    description: z.string().min(15, "Please provide a detailed description."),
    reported_by: z.string(),
    status: z.enum(['New', 'In Progress', 'Resolved']),
    createdAt: z.any(),
});

export type SystemFeedback = z.infer<typeof SystemFeedbackSchema>;

export const SystemFeedbackFormDataSchema = SystemFeedbackSchema.omit({ id: true, createdAt: true, reported_by: true, status: true });
export type SystemFeedbackFormData = z.infer<typeof SystemFeedbackFormDataSchema>;
