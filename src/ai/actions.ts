'use server';

import { createAlertFlow, type AlertInput } from './flows/create-alert-flow';
import { dailyPlannerFlow, type DailyPlannerAIInput, type DailyPlannerAIOutput } from './flows/daily-planner-flow';
import { strategicAdvisorFlow, type StrategicAdvisorInput, type StrategicAdvisorOutput } from './flows/strategic-advisor-flow';
import { generateImpactStory as impactStoryFlow, type ImpactStoryInput, type ImpactStoryOutput } from './flows/impact-story-generator';
import { processTestimony as testimonyProcessorFlow, type TestimonyInput, type TestimonyOutput } from './flows/testimony-processor-flow';
import { parseOperationalPlan, type ParsePlanInput, type ParsePlanOutput } from './flows/parse-operational-plan-flow';

export async function runDailyPlanner(input: DailyPlannerAIInput): Promise<DailyPlannerAIOutput> {
    return await dailyPlannerFlow(input);
}

export async function runStrategicAdvisor(input: StrategicAdvisorInput): Promise<StrategicAdvisorOutput> {
    return await strategicAdvisorFlow(input);
}

export async function runImpactStoryGenerator(input: ImpactStoryInput): Promise<ImpactStoryOutput> {
    return await impactStoryFlow(input);
}

export async function runTestimonyProcessor(input: TestimonyInput): Promise<TestimonyOutput> {
    return await testimonyProcessorFlow(input);
}

export async function runParseOperationalPlan(input: ParsePlanInput): Promise<ParsePlanOutput> {
    return await parseOperationalPlan(input);
}

export async function createAlert(input: AlertInput) {
    return await createAlertFlow(input);
}
