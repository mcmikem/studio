import { z } from 'zod';

export const KeyResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  currentProgress: z.coerce.number(),
  target: z.coerce.number(),
  deadline: z.any(),
  priority: z.enum(['High', 'Medium', 'Low']),
});

export type KeyResult = z.infer<typeof KeyResultSchema>;

export const ImpactMetricSchema = z.object({
    id: z.string(),
    metric: z.string(),
    target: z.coerce.number(),
    current: z.coerce.number(),
    unit: z.string().optional(),
    valuePerUnit: z.coerce.number().optional(),
    createdAt: z.any(),
});

export type ImpactMetric = z.infer<typeof ImpactMetricSchema>;

export const KpiSchema = ImpactMetricSchema;
export type Kpi = ImpactMetric;
