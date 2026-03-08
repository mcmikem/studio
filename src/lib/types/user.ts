import { z } from 'zod';
import { Timestamp } from 'firebase-admin/firestore';

export const UserSchema = z.object({
    id: z.string(),
    role: z.string(),
    name: z.string(),
    email: z.string().email(),
    photoURL: z.string().url().optional(),
    createdAt: z.any().optional(),
    supervisorId: z.string().optional(),
});

export type User = z.infer<typeof UserSchema>;
export type TeamMemberRole = any;
