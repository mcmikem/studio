import { z } from 'zod';

export const ActivitySchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string(),
  title: z.string(),
  ecosystem_phase: z.enum(["Identify & Inspire", "Equip & Empower", "Activate & Sustain"]),
  primaryGoalType: z.enum(["Metric", "Program"]),
  primaryGoalId: z.string(),
  primaryGoalQuantity: z.number(),
  estimatedCost: z.number(),
  actualCost: z.number(),
  directValue: z.number(),
  indirectValue: z.number(),
  totalValue: z.number(),
  estimatedRoi: z.number(),
  finalRoi: z.number(),
  loggedAt: z.any(),
  parents_attended: z.number().optional(),
  teachers_attended: z.number().optional(),
  trees_planted: z.number().optional(),
  memorableMoment: z.string().optional(),
  challengesLearned: z.string().optional(),
  beneficiaryQuote: z.string().optional(),
});

export type Activity = z.infer<typeof ActivitySchema>;
