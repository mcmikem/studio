
'use server';

import { createAlert as createAlertAction, AlertInputSchema } from './flows/create-alert-flow';
import { dailyPlannerFlow, DailyPlannerAIInputSchema, DailyPlannerAIOutputSchema } from './flows/daily-planner-flow';
import { strategicAdvisorFlow, StrategicAdvisorInputSchema, StrategicAdvisorOutputSchema } from './flows/strategic-advisor-flow';
import { generateImpactStory as generateImpactStoryFlow, ImpactStoryInputSchema, ImpactStoryOutputSchema } from './flows/impact-story-generator';
import { processTestimony as processTestimonyFlow, TestimonyInputSchema, TestimonyOutputSchema } from './flows/testimony-processor-flow';
import { parseOperationalPlan as parseOperationalPlanFlow, ParsePlanInputSchema, ParsePlanOutputSchema } from './flows/parse-operational-plan-flow';
import { generateTemplate as generateTemplateFlow, GenerateTemplateInputSchema, GenerateTemplateOutputSchema } from './flows/generate-template-flow';
import { parseWorkplan as parseWorkplanFlow, ParseWorkplanInputSchema, ParseWorkplanOutputSchema } from './flows/parse-workplan-flow';
import { analyzeProgramQualitativeData as analyzeProgramQualitativeDataFlow, QualitativeAnalysisInputSchema, QualitativeAnalysisOutputSchema } from './flows/qualitative-analysis-flow';
import { findGrants as findGrantsFlow, GrantFinderInputSchema } from './flows/grant-finder-flow';
import type { GrantFinderOutput } from '@/lib/types';
import { omutoAIFlow as omutoAIFlowFlow, OmutoAIInputSchema, OmutoAIOutputSchema } from './flows/omuto-ai-flow';
import { z } from 'zod';

export async function runDailyPlanner(input: z.infer<typeof DailyPlannerAIInputSchema>): Promise<z.infer<typeof DailyPlannerAIOutputSchema>> {
    return await dailyPlannerFlow(input);
}

export async function runStrategicAdvisor(input: z.infer<typeof StrategicAdvisorInputSchema>): Promise<z.infer<typeof StrategicAdvisorOutputSchema>> {
    const plainInput = JSON.parse(JSON.stringify(input));
    return await strategicAdvisorFlow(plainInput);
}

export async function generateImpactStory(input: z.infer<typeof ImpactStoryInputSchema>): Promise<z.infer<typeof ImpactStoryOutputSchema>> {
    return await generateImpactStoryFlow(input);
}

export async function runTestimonyProcessor(input: z.infer<typeof TestimonyInputSchema>): Promise<z.infer<typeof TestimonyOutputSchema>> {
    return await processTestimonyFlow(input);
}

export async function parseOperationalPlan(input: z.infer<typeof ParsePlanInputSchema>): Promise<z.infer<typeof ParsePlanOutputSchema>> {
    return await parseOperationalPlanFlow(input);
}

export async function createAlert(input: z.infer<typeof AlertInputSchema>) {
    return await createAlertAction(input);
}

export async function generateTemplate(input: z.infer<typeof GenerateTemplateInputSchema>): Promise<z.infer<typeof GenerateTemplateOutputSchema>> {
    return await generateTemplateFlow(input);
}

export async function parseWorkplan(input: z.infer<typeof ParseWorkplanInputSchema>): Promise<z.infer<typeof ParseWorkplanOutputSchema>> {
    return await parseWorkplanFlow(input);
}

export async function analyzeProgramQualitativeData(input: z.infer<typeof QualitativeAnalysisInputSchema>): Promise<z.infer<typeof QualitativeAnalysisOutputSchema>> {
    return await analyzeProgramQualitativeDataFlow(input);
}

export async function findGrants(input: z.infer<typeof GrantFinderInputSchema>): Promise<GrantFinderOutput> {
    return await findGrantsFlow(input);
}

export async function runOmutoAIFlow(input: z.infer<typeof OmutoAIInputSchema>): Promise<z.infer<typeof OmutoAIOutputSchema>> {
    return await omutoAIFlowFlow(input);
}
