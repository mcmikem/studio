import { z } from 'zod';
import { ActivitySchema } from './activity';
import { CheckinSchema } from './checkin-checkout';
import { ExpenseSchema } from './finance';
import { KeyResultSchema } from './okr';

export const DailyPlannerAIInputSchema = z.object({
  userName: z.string(),
  userRole: z.string(),
  primaryMission: z.string(),
  weeklyPriorities: z.array(z.string()).optional(),
  keyResults: z.array(z.any()).optional(),
});
export type DailyPlannerAIInput = z.infer<typeof DailyPlannerAIInputSchema>;

export const DailyPlannerAIOutputSchema = z.object({
  timeBlocks: z.array(
    z.object({
      startTime: z.string(),
      endTime: z.string(),
      description: z.string(),
    })
  ),
  strategicAlignments: z.array(
    z.object({
      krTitle: z.string(),
      alignmentJustification: z.string(),
    })
  ).optional(),
  materials: z.string().optional(),
  challenges: z.string().optional(),
  bestPractice: z.string().optional(),
});
export type DailyPlannerAIOutput = z.infer<typeof DailyPlannerAIOutputSchema>;

export const StrategicAdvisorInputSchema = z.object({
  activities: z.array(ActivitySchema),
  checkins: z.array(CheckinSchema),
  expenses: z.array(ExpenseSchema),
  keyResults: z.array(KeyResultSchema),
});
export type StrategicAdvisorInput = z.infer<typeof StrategicAdvisorInputSchema>;

export const StrategicAdvisorOutputSchema = z.object({
  insights: z.array(z.object({
    emoji: z.string(),
    title: z.string(),
    description: z.string(),
    recommendation: z.string()
  }))
})
export type StrategicAdvisorOutput = z.infer<typeof StrategicAdvisorOutputSchema>;

export const ParsePlanInputSchema = z.object({ planText: z.string() });
export type ParsePlanInput = z.infer<typeof ParsePlanInputSchema>;

export const ParsePlanOutputSchema = z.object({
    keyResults: z.array(KeyResultSchema.omit({id: true}))
});
export type ParsePlanOutput = z.infer<typeof ParsePlanOutputSchema>;

export const GenerateTemplateInputSchema = z.object({
  description: z.string(),
});
export type GenerateTemplateInput = z.infer<typeof GenerateTemplateInputSchema>;

export const GenerateTemplateOutputSchema = z.object({
  title: z.string(),
  checklistItems: z.array(z.string()),
});
export type GenerateTemplateOutput = z.infer<typeof GenerateTemplateOutputSchema>;

export const ParseWorkplanInputSchema = z.object({
  textPlan: z.string(),
});
export type ParseWorkplanInput = z.infer<typeof ParseWorkplanInputSchema>;

export const ParseWorkplanOutputSchema = z.object({
    keyPriorities: z.any(), // Simplified to avoid circularity if needed, or use the real schema
    message: z.string(),
});
export type ParseWorkplanOutput = z.infer<typeof ParseWorkplanOutputSchema>;

export const QualitativeAnalysisInputSchema = z.object({
  programId: z.string(),
  programName: z.string(),
  startDate: z.string(),
  endDate: z.string(),
});
export type QualitativeAnalysisInput = z.infer<typeof QualitativeAnalysisInputSchema>;

export const QualitativeAnalysisOutputSchema = z.object({
    summary: z.string(),
    recurringSuccesses: z.array(z.string()),
    commonChallenges: z.array(z.string()),
    keyLearnings: z.array(z.string()),
});
export type QualitativeAnalysisOutput = z.infer<typeof QualitativeAnalysisOutputSchema>;

export const GrantFinderInputSchema = z.object({ query: z.string() });
export type GrantFinderInput = z.infer<typeof GrantFinderInputSchema>;

export const GrantFinderOutputSchema = z.object({
    opportunities: z.array(z.object({
        title: z.string(),
        funder: z.string(),
        description: z.string(),
        amount: z.number(),
        deadline: z.string(),
    }))
});
export type GrantFinderOutput = z.infer<typeof GrantFinderOutputSchema>;

export const OmutoAIInputSchema = z.object({
  question: z.string(),
  history: z.any().optional(),
  userId: z.string(),
});
export type OmutoAIInput = z.infer<typeof OmutoAIInputSchema>;

export const OmutoAIOutputSchema = z.object({
  answer: z.string(),
});
export type OmutoAIOutput = z.infer<typeof OmutoAIOutputSchema>;

export const SmartRemindersInputSchema = z.object({
    userId: z.string(),
    userName: z.string(),
    userRole: z.string(),
});
export type SmartRemindersInput = z.infer<typeof SmartRemindersInputSchema>;

export const SmartRemindersOutputSchema = z.object({
    reminders: z.array(z.string()),
});
export type SmartRemindersOutput = z.infer<typeof SmartRemindersOutputSchema>;

export const GrantWriterInputSchema = z.object({
  partnerName: z.string(),
  proposalTitle: z.string(),
  amountRequested: z.string(),
});
export type GrantWriterInput = z.infer<typeof GrantWriterInputSchema>;

export const GrantWriterOutputSchema = z.object({
  conceptNote: z.string(),
});
export type GrantWriterOutput = z.infer<typeof GrantWriterOutputSchema>;

export const SearchResultItemSchema = z.object({
  title: z.string(),
  link: z.string(),
  snippet: z.string(),
});
export type SearchResultItem = z.infer<typeof SearchResultItemSchema>;
