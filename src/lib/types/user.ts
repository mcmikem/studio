import { z } from 'zod';
import { Timestamp } from 'firebase-admin/firestore';

export type TeamMemberRole =
  | 'Executive Director'
  | 'Administrator'
  | 'Programs & Partnerships Manager'
  | 'Operations & Field Manager'
  | 'Media & Finance Lead'
  | 'Media & Communications Lead'
  | 'Resource Mobilization Lead'
  | 'Essentials Manager'
  | 'Youth Center Manager'
  | 'Accountant/Finance'
  | 'Intern'
  | 'Volunteer';

export const UserSchema = z.object({
    id: z.string(),
    role: z.string(),
    name: z.string(),
    email: z.string().email(),
    photoURL: z.string().optional(),
    createdAt: z.any().optional(),
    supervisorId: z.string().optional(),
});

export type User = z.infer<typeof UserSchema>;
