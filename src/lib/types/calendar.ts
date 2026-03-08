import { z } from 'zod';

export const CalendarEventSchema = z.object({
    id: z.string(),
    title: z.string(),
    date: z.any(),
    category: z.string(),
    location: z.string(),
    responsible: z.string(),
    createdAt: z.any(),
});

export type CalendarEvent = z.infer<typeof CalendarEventSchema>;
