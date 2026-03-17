import { z } from 'zod';

export const ActivitySchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string(),
  title: z.string(),
  ecosystem_phase: z.enum(["Identify & Inspire", "Equip & Empower", "Activate & Sustain"]),
  primaryGoalType: z.enum(["Metric", "Program"]),
  primaryGoalId: z.string(),
  primaryGoalQuantity: z.coerce.number(),
  estimatedCost: z.coerce.number(),
  actualCost: z.coerce.number(),
  directValue: z.coerce.number(),
  indirectValue: z.coerce.number(),
  totalValue: z.coerce.number(),
  estimatedRoi: z.coerce.number(),
  finalRoi: z.coerce.number(),
  loggedAt: z.any(),
  parents_attended: z.coerce.number().optional(),
  teachers_attended: z.coerce.number().optional(),
  trees_planted: z.coerce.number().optional(),
  memorableMoment: z.string().optional(),
  challengesLearned: z.string().optional(),
  beneficiaryQuote: z.string().optional(),
});

export type Activity = z.infer<typeof ActivitySchema>;
