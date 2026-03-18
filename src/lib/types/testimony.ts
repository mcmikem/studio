import { z } from 'zod';

export const TestimonySchema = z.object({
    id: z.string(),
    title: z.string(),
    userId: z.string(),
    userName: z.string(),
    beneficiaryName: z.string(),
    project: z.string(),
    district: z.string().optional(),
    subcounty: z.string().optional(),
    parish: z.string().optional(),
    beforeSituation: z.string(),
    afterSituation: z.string(),
    quote: z.string(),
    mediaUrls: z.array(z.string().url()).optional(),
    consentSigned: z.boolean(),
    createdAt: z.any(),
    transcription: z.string().optional(),
    summary: z.string().optional(),
    quotes: z.array(z.string()).optional(),
    hashtags: z.array(z.string()).optional(),
});
export type Testimony = z.infer<typeof TestimonySchema>;

export const TestimonyInputSchema = z.object({
  mediaUri: z.string().url().optional(),
  transcription: z.string().optional(),
});
export type TestimonyInput = z.infer<typeof TestimonyInputSchema>;

export const TestimonyOutputSchema = z.object({
    transcription: z.string(),
    summary: z.string(),
    quotes: z.array(z.string()),
    hashtags: z.array(z.string()),
});
export type TestimonyOutput = z.infer<typeof TestimonyOutputSchema>;

export const ImpactStoryInputSchema = z.object({
  activityName: z.string(),
  activityDescription: z.string(),
  activityImpact: z.string(),
  userName: z.string(),
  userQuote: z.string().optional(),
  memorableMoment: z.string().optional(),
  challengesLearned: z.string().optional(),
});
export type ImpactStoryInput = z.infer<typeof ImpactStoryInputSchema>;

export const ImpactStoryOutputSchema = z.object({
  impactStory: z.string(),
});
export type ImpactStoryOutput = z.infer<typeof ImpactStoryOutputSchema>;
