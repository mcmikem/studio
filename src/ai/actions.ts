
'use server';

import { createAlertFlow, AlertInputSchema } from './flows/create-alert-flow';
import { dailyPlannerFlow, DailyPlannerAIInputSchema, DailyPlannerAIOutputSchema } from './flows/daily-planner-flow';
import { strategicAdvisorFlow, StrategicAdvisorInputSchema, StrategicAdvisorOutputSchema } from './flows/strategic-advisor-flow';
import { impactStoryFlow, ImpactStoryInputSchema, ImpactStoryOutputSchema } from './flows/impact-story-generator';
import { testimonyProcessorFlow, TestimonyInputSchema, TestimonyOutputSchema } from './flows/testimony-processor-flow';
import { parseOperationalPlanFlow, ParsePlanInputSchema, ParsePlanOutputSchema } from './flows/parse-operational-plan-flow';
import { generateTemplateFlow, GenerateTemplateInputSchema, GenerateTemplateOutputSchema } from './flows/generate-template-flow';
import { parseWorkplanFlow } from './flows/parse-workplan-flow';
import { analyzeProgramQualitativeDataFlow, QualitativeAnalysisInputSchema, QualitativeAnalysisOutputSchema } from './flows/qualitative-analysis-flow';
import { findGrantsFlow, GrantFinderInputSchema, GrantFinderOutputSchema } from './flows/grant-finder-flow';
import { omutoAIFlow, OmutoAIInputSchema, OmutoAIOutputSchema } from './flows/omuto-ai-flow';
import { generateSmartRemindersFlow, SmartRemindersInputSchema, SmartRemindersOutputSchema } from './flows/smart-reminders-flow';
import { z } from 'zod';
import { ParseWorkplanInputSchema, ParseWorkplanOutputSchema } from '@/lib/types';

export async function runDailyPlanner(input: z.infer<typeof DailyPlannerAIInputSchema>): Promise<z.infer<typeof DailyPlannerAIOutputSchema>> {
    return await dailyPlannerFlow(input);
}

export async function runStrategicAdvisor(input: z.infer<typeof StrategicAdvisorInputSchema>): Promise<z.infer<typeof StrategicAdvisorOutputSchema>> {
    return await strategicAdvisorFlow(input);
}

export async function runImpactStoryGenerator(input: z.infer<typeof ImpactStoryInputSchema>): Promise<z.infer<typeof ImpactStoryOutputSchema>> {
    return await impactStoryFlow(input);
}

export async function generateImpactStory(input: z.infer<typeof ImpactStoryInputSchema>) {
    return await impactStoryFlow(input);
}

export async function runTestimonyProcessor(input: z.infer<typeof TestimonyInputSchema>): Promise<z.infer<typeof TestimonyOutputSchema>> {
    return await testimonyProcessorFlow(input);
}

export async function processTestimony(input: z.infer<typeof TestimonyInputSchema>) {
    return await testimonyProcessorFlow(input);
}

export async function runParseOperationalPlan(input: z.infer<typeof ParsePlanInputSchema>): Promise<z.infer<typeof ParsePlanOutputSchema>> {
    return await parseOperationalPlanFlow(input);
}

export async function parseOperationalPlan(input: z.infer<typeof ParsePlanInputSchema>) {
    return await parseOperationalPlanFlow(input);
}

export async function runGenerateTemplate(input: z.infer<typeof GenerateTemplateInputSchema>): Promise<z.infer<typeof GenerateTemplateOutputSchema>> {
    return await generateTemplateFlow(input);
}

export async function generateTemplate(input: z.infer<typeof GenerateTemplateInputSchema>) {
    return await generateTemplateFlow(input);
}

export async function runParseWorkplan(input: z.infer<typeof ParseWorkplanInputSchema>): Promise<z.infer<typeof ParseWorkplanOutputSchema>> {
    return await parseWorkplanFlow(input);
}

export async function parseWorkplan(input: z.infer<typeof ParseWorkplanInputSchema>) {
    return await parseWorkplanFlow(input);
}

export async function runQualitativeAnalysis(input: z.infer<typeof QualitativeAnalysisInputSchema>): Promise<z.infer<typeof QualitativeAnalysisOutputSchema>> {
    return await analyzeProgramQualitativeDataFlow(input);
}

export async function analyzeProgramQualitativeData(input: z.infer<typeof QualitativeAnalysisInputSchema>) {
    return await analyzeProgramQualitativeDataFlow(input);
}

export async function runGrantFinder(input: z.infer<typeof GrantFinderInputSchema>): Promise<z.infer<typeof GrantFinderOutputSchema>> {
    return await findGrantsFlow(input);
}

export async function findGrants(input: z.infer<typeof GrantFinderInputSchema>) {
    return await findGrantsFlow(input);
}

export async function runOmutoAI(input: z.infer<typeof OmutoAIInputSchema>): Promise<z.infer<typeof OmutoAIOutputSchema>> {
    return await omutoAIFlow(input);
}

export async function omutoAI(input: z.infer<typeof OmutoAIInputSchema>) {
    return await omutoAIFlow(input);
}

export async function runSmartReminders(input: z.infer<typeof SmartRemindersInputSchema>): Promise<z.infer<typeof SmartRemindersOutputSchema>> {
    return await generateSmartRemindersFlow(input);
}

export async function generateSmartReminders(input: z.infer<typeof SmartRemindersInputSchema>) {
    return await generateSmartRemindersFlow(input);
}

export async function createAlert(input: z.infer<typeof AlertInputSchema>) {
    return await createAlertFlow(input);
}
