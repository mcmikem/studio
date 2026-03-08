
'use server';



import { strategicAdvisorFlow } from './flows/strategic-advisor-flow';
import { impactStoryFlow } from './flows/impact-story-generator';
import { testimonyProcessorFlow } from './flows/testimony-processor-flow';
import { parseOperationalPlanFlow } from './flows/parse-operational-plan-flow';

import { parseWorkplanFlow } from './flows/parse-workplan-flow';
import { analyzeProgramQualitativeDataFlow } from './flows/qualitative-analysis-flow';

import { omutoAIFlow } from './flows/omuto-ai-flow';

import {



    StrategicAdvisorInput,
    StrategicAdvisorOutput,
    ImpactStoryInput,
    ImpactStoryOutput,
    TestimonyInput,
    TestimonyOutput,
    ParsePlanInput,
    ParsePlanOutput,


    ParseWorkplanInput,
    ParseWorkplanOutput,
    QualitativeAnalysisInput,
    QualitativeAnalysisOutput,


    OmutoAIInput,
    OmutoAIOutput,


} from '@/lib/types';




export async function runStrategicAdvisor(input: StrategicAdvisorInput): Promise<StrategicAdvisorOutput> {
    try {
        return await strategicAdvisorFlow(input);
    } catch (error) {
        console.error('runStrategicAdvisor failed:', error);
        return { insights: [] };
    }
}

export async function generateImpactStory(input: ImpactStoryInput) {
    try {
        return await impactStoryFlow(input);
    } catch (error) {
        console.error('generateImpactStory failed:', error);
        return { impactStory: "Unable to generate story at this time." };
    }
}

export async function processTestimony(input: TestimonyInput) {
    try {
        return await testimonyProcessorFlow(input);
    } catch (error) {
        console.error('processTestimony failed:', error);
        throw error;
    }
}

export async function parseOperationalPlan(input: ParsePlanInput) {
    try {
        return await parseOperationalPlanFlow(input);
    } catch (error) {
        console.error('parseOperationalPlan failed:', error);
        return { keyResults: [] };
    }
}



export async function runParseWorkplan(input: ParseWorkplanInput): Promise<ParseWorkplanOutput> {
    try {
        return await parseWorkplanFlow(input);
    } catch (error) {
        console.error('runParseWorkplan failed:', error);
        return { keyPriorities: [], message: 'Error parsing workplan.' };
    }
}

export async function runQualitativeAnalysis(input: QualitativeAnalysisInput) {
    try {
        return await analyzeProgramQualitativeDataFlow(input);
    } catch (error) {
        console.error('runQualitativeAnalysis failed:', error);
        return { summary: 'Error analyzing data.', recurringSuccesses: [], commonChallenges: [], keyLearnings: [] };
    }
}



export async function omutoAI(input: OmutoAIInput): Promise<OmutoAIOutput> {
    try {
        return await omutoAIFlow(input);
    } catch (error) {
        console.error('omutoAI server action failed:', error);
        return {
            answer: "I'm temporarily unable to reach the AI service right now. Please retry in a moment."
        };
    }
}





export async function runImpactStoryGenerator(input: ImpactStoryInput) {
  return generateImpactStory(input);
}

export async function runTestimonyProcessor(input: TestimonyInput) {
  return processTestimony(input);
}
