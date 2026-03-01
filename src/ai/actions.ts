
'use server';

import { createAlertFlow } from './flows/create-alert-flow';
import { dailyPlannerFlow } from './flows/daily-planner-flow';
import { strategicAdvisorFlow } from './flows/strategic-advisor-flow';
import { generateImpactStory as impactStoryFlow } from './flows/impact-story-generator';
import { processTestimony as testimonyProcessorFlow } from './flows/testimony-processor-flow';
import { parseOperationalPlan as parseOperationalPlanFlow } from './flows/parse-operational-plan-flow';
import { generateTemplate as generateTemplateFlow } from './flows/generate-template-flow';
import { parseWorkplan as parseWorkplanFlow } from './flows/parse-workplan-flow';
import { analyzeProgramQualitativeDataFlow } from './flows/qualitative-analysis-flow';
import { findGrants as findGrantsFlow } from './flows/grant-finder-flow';
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
import { z } from 'zod';


export async function runDailyPlanner(input: DailyPlannerAIInput): Promise<DailyPlannerAIOutput> {
    return await dailyPlannerFlow(input);
}

export async function runStrategicAdvisor(input: StrategicAdvisorInput): Promise<StrategicAdvisorOutput> {
    const plainInput = JSON.parse(JSON.stringify(input));
    return await strategicAdvisorFlow(plainInput);
}

export async function runImpactStoryGenerator(input: ImpactStoryInput): Promise<ImpactStoryOutput> {
    return await impactStoryFlow(input);
}

export async function generateImpactStory(input: ImpactStoryInput) {
    return await impactStoryFlow(input);
}

export async function runTestimonyProcessor(input: TestimonyInput): Promise<TestimonyOutput> {
    return await testimonyProcessorFlow(input);
}

export async function processTestimony(input: TestimonyInput) {
    return await testimonyProcessorFlow(input);
}

export async function runParseOperationalPlan(input: ParsePlanInput): Promise<ParsePlanOutput> {
    return await parseOperationalPlanFlow(input);
}

export async function parseOperationalPlan(input: ParsePlanInput) {
    return await parseOperationalPlanFlow(input);
}

export async function runGenerateTemplate(input: GenerateTemplateInput): Promise<GenerateTemplateOutput> {
    return await generateTemplateFlow(input);
}

export async function generateTemplate(input: GenerateTemplateInput) {
    return await generateTemplateFlow(input);
}

export async function runParseWorkplan(input: ParseWorkplanInput): Promise<ParseWorkplanOutput> {
    return await parseWorkplanFlow(input);
}

export async function runQualitativeAnalysis(input: QualitativeAnalysisInput): Promise<QualitativeAnalysisOutput> {
    return await analyzeProgramQualitativeDataFlow(input);
}

export async function analyzeProgramQualitativeData(input: QualitativeAnalysisInput) {
    return await analyzeProgramQualitativeDataFlow(input);
}

export async function runGrantFinder(input: GrantFinderInput): Promise<GrantFinderOutput> {
    return await findGrantsFlow(input);
}

export async function findGrants(input: GrantFinderInput) {
    return await findGrantsFlow(input);
}

export async function runOmutoAI(input: OmutoAIInput): Promise<OmutoAIOutput> {
    return await omutoAIFlow(input);
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

  