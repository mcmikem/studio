import { z } from 'zod';

export const CheckinSchema = z.object({
    id: z.string(),
    userId: z.string(),
    name: z.string(),
    primaryMission: z.string(),
    mood: z.string(),
    details: z.any(),
    workingStartTime: z.string().optional(),
    workingEndTime: z.string().optional(),
    timestamp: z.any(),
});

export type Checkin = z.infer<typeof CheckinSchema>;

export const CheckoutTaskSchema = z.object({
  description: z.string(),
  status: z.enum(['Done', 'Not Done']),
  reason: z.string().optional(),
});

export type CheckoutTask = z.infer<typeof CheckoutTaskSchema>;

export const CheckoutSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  role: z.string(),
  avatar: z.string(),
  tasks: z.array(CheckoutTaskSchema),
  learning: z.string().optional(),
  tomorrowPlan: z.string().optional(),
  timestamp: z.any(),
});

export type Checkout = z.infer<typeof CheckoutSchema>;

export const RecentCheckoutSchema = CheckoutSchema;
export type RecentCheckout = z.infer<typeof RecentCheckoutSchema>;
