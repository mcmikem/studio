
'use server';

import { createAlertFlow } from './flows/create-alert-flow';
import { dailyPlannerFlow } from './flows/daily-planner-flow';
import { strategicAdvisorFlow } from './flows/strategic-advisor-flow';
import { impactStoryFlow } from './flows/impact-story-generator';
import { testimonyProcessorFlow } from './flows/testimony-processor-flow';
import { parseOperationalPlanFlow } from './flows/parse-operational-plan-flow';
import { generateTemplateFlow } from './flows/generate-template-flow';
import { parseWorkplanFlow } from './flows/parse-workplan-flow';
import { analyzeProgramQualitativeDataFlow } from './flows/qualitative-analysis-flow';
import { findGrantsFlow } from './flows/grant-finder-flow';
import { omutoAIFlow } from './flows/omuto-ai-flow';
import { generateSmartReminders } from './flows/smart-reminders-flow';
import {
    AlertInput,
    DailyPlannerAIInput,
    DailyPlannerAIOutput,
    StrategicAdvisorInput,
    StrategicAdvisorOutput,
    ImpactStoryInput,
    ImpactStoryOutput,
    TestimonyInput,
    TestimonyOutput,
    ParsePlanInput,
    ParsePlanOutput,
    GenerateTemplateInput,
    GenerateTemplateOutput,
    ParseWorkplanInput,
    ParseWorkplanOutput,
    QualitativeAnalysisInput,
    QualitativeAnalysisOutput,
    GrantFinderInput,
    GrantFinderOutput,
    OmutoAIInput,
    OmutoAIOutput,
    SmartRemindersInput,
    SmartRemindersOutput,
} from '@/lib/types';


export async function runDailyPlanner(input: DailyPlannerAIInput): Promise<DailyPlannerAIOutput> {
    return await dailyPlannerFlow(input);
}

export async function runStrategicAdvisor(input: StrategicAdvisorInput): Promise<StrategicAdvisorOutput> {
    return await strategicAdvisorFlow(input);
}

export async function generateImpactStory(input: ImpactStoryInput) {
    return await impactStoryFlow(input);
}

export async function processTestimony(input: TestimonyInput) {
    return await testimonyProcessorFlow(input);
}

export async function parseOperationalPlan(input: ParsePlanInput) {
    return await parseOperationalPlanFlow(input);
}

export async function generateTemplate(input: GenerateTemplateInput) {
    return await generateTemplateFlow(input);
}

export async function runParseWorkplan(input: ParseWorkplanInput): Promise<ParseWorkplanOutput> {
    return await parseWorkplanFlow(input);
}

export async function analyzeProgramQualitativeData(input: QualitativeAnalysisInput) {
    return await analyzeProgramQualitativeDataFlow(input);
}

export async function runGrantFinder(input: GrantFinderInput): Promise<GrantFinderOutput> {
    return await findGrantsFlow(input);
}

export async function omutoAI(input: OmutoAIInput) {
    return await omutoAIFlow(input);
}

export async function runSmartReminders(input: SmartRemindersInput): Promise<SmartRemindersOutput> {
    return await generateSmartReminders(input);
}

export async function createAlert(input: AlertInput) {
    return await createAlertFlow(input);
}

export async function runImpactStoryGenerator(input: ImpactStoryInput) {
  return impactStoryFlow(input);
}

export async function runTestimonyProcessor(input: TestimonyInput) {
  return testimonyProcessorFlow(input);
}
  
