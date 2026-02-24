
'use server';

import { createAlert as createAlertAction, AlertInputSchema } from './flows/create-alert-flow';
import { dailyPlannerFlow, DailyPlannerAIInputSchema, DailyPlannerAIOutputSchema } from './flows/daily-planner-flow';
import { strategicAdvisorFlow, StrategicAdvisorInputSchema, StrategicAdvisorOutputSchema } from './flows/strategic-advisor-flow';
import { generateImpactStory, ImpactStoryInputSchema, ImpactStoryOutputSchema } from './flows/impact-story-generator';
import { processTestimony, TestimonyInputSchema, TestimonyOutputSchema } from './flows/testimony-processor-flow';
import { parseOperationalPlan, ParsePlanInputSchema, ParsePlanOutputSchema } from './flows/parse-operational-plan-flow';
import { z } from 'zod';

export async function runDailyPlanner(input: z.infer<typeof DailyPlannerAIInputSchema>): Promise<z.infer<typeof DailyPlannerAIOutputSchema>> {
    return await dailyPlannerFlow(input);
}

export async function runStrategicAdvisor(input: z.infer<typeof StrategicAdvisorInputSchema>): Promise<z.infer<typeof StrategicAdvisorOutputSchema>> {
    return await strategicAdvisorFlow(input);
}

export async function runImpactStoryGenerator(input: z.infer<typeof ImpactStoryInputSchema>): Promise<z.infer<typeof ImpactStoryOutputSchema>> {
    return await generateImpactStory(input);
}

export async function runTestimonyProcessor(input: z.infer<typeof TestimonyInputSchema>): Promise<z.infer<typeof TestimonyOutputSchema>> {
    return await processTestimony(input);
}

export async function runParseOperationalPlan(input: z.infer<typeof ParsePlanInputSchema>): Promise<z.infer<typeof ParsePlanOutputSchema>> {
    return await parseOperationalPlan(input);
}

export async function createAlert(input: z.infer<typeof AlertInputSchema>) {
    return await createAlertAction(input);
}
