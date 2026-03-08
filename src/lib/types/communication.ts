import { z } from 'zod';

export const MessageSchema = z.object({
    id: z.string(),
    text: z.string(),
    userId: z.string(),
    userName: z.string(),
    userAvatar: z.string().optional(),
    createdAt: z.any(),
});

export type Message = z.infer<typeof MessageSchema>;

export const AlertSchema = z.object({
    id: z.string(),
    type: z.enum(['Urgent', 'Reminder', 'Info']),
    message: z.string(),
    priority: z.enum(['High', 'Medium', 'Low']),
    action: z.string(),
    creatorId: z.string(),
    createdAt: z.any(),
    readBy: z.array(z.string()).optional(),
    targetUserIds: z.array(z.string()).optional(),
});

export type Alert = z.infer<typeof AlertSchema>;

export const AlertInputSchema = AlertSchema.omit({id: true, createdAt: true, readBy: true});
export type AlertInput = z.infer<typeof AlertInputSchema>;
