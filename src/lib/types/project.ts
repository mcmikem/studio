import { z } from 'zod';

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  manager: z.string(),
  districts: z.string(),
  status: z.enum(["Active", "Moderate", "At Risk", "Delayed", "Completed"]),
  completion: z.number(),
  nextMilestone: z.string(),
  partner: z.string().optional(),
  participants: z.number().optional(),
  attendanceRate: z.number().optional(),
  learningImprovement: z.number().optional(),
  adoptionRate: z.number().optional(),
  startDate: z.any().optional(),
  endDate: z.any().optional(),
  createdAt: z.any().optional(),
});

export type Project = z.infer<typeof ProjectSchema>;

export const ProjectParticipantSchema = z.object({
    id: z.string(),
    name: z.string(),
    phone: z.string().optional(),
    village: z.string().optional(),
    businessStage: z.enum(['Ideation', 'Operating', 'Growth']),
    attendance: z.number().optional(),
    businessScore: z.number().optional(),
    avatar: z.string().url().optional(),
    createdAt: z.any().optional()
});

export type ProjectParticipant = z.infer<typeof ProjectParticipantSchema>;

export const ProjectParticipantFormSchema = ProjectParticipantSchema.omit({ id: true, createdAt: true });
export type ProjectParticipantFormData = z.infer<typeof ProjectParticipantFormSchema>;

export const BusinessIdeaSchema = z.object({
    id: z.string(),
    businessName: z.string(),
});
export type BusinessIdea = z.infer<typeof BusinessIdeaSchema>;
