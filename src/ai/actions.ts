
'use server';

import { omutoAIFlow } from './flows/omuto-ai-flow';
import { chatWithOpenRouter } from '@/lib/openrouter';
import { aiConfig } from '@/lib/ai';

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
        const { getStrategicInsights } = await import('./flows/strategic-advisor-flow');
        return await getStrategicInsights(input);
    } catch (error) {
        console.error('runStrategicAdvisor failed:', error);
        return { insights: [] };
    }
}

export async function generateImpactStory(input: ImpactStoryInput) {
    try {
        const { generateImpactStory: generateStory } = await import('./flows/impact-story-generator');
        return await generateStory(input);
    } catch (error) {
        console.error('generateImpactStory failed:', error);
        return { impactStory: "Unable to generate story at this time." };
    }
}

export async function processTestimony(input: TestimonyInput) {
    try {
        const { processTestimony: processTest } = await import('./flows/testimony-processor-flow');
        return await processTest(input);
    } catch (error) {
        console.error('processTestimony failed:', error);
        throw error;
    }
}

export async function parseOperationalPlan(input: ParsePlanInput) {
    try {
        const { parseOperationalPlan: parsePlan } = await import('./flows/parse-operational-plan-flow');
        return await parsePlan(input);
    } catch (error) {
        console.error('parseOperationalPlan failed:', error);
        return { keyResults: [] };
    }
}



export async function runParseWorkplan(input: ParseWorkplanInput): Promise<ParseWorkplanOutput> {
    try {
        const { parseWorkplan } = await import('./flows/parse-workplan-flow');
        return await parseWorkplan(input);
    } catch (error) {
        console.error('runParseWorkplan failed:', error);
        return { keyPriorities: [], message: 'Error parsing workplan.' };
    }
}

export async function runQualitativeAnalysis(input: QualitativeAnalysisInput) {
    try {
        const { analyzeQualitativeData } = await import('./flows/qualitative-analysis-flow');
        return await analyzeQualitativeData({ 
            programName: input.programName, 
            programId: input.programId, 
            startDate: input.startDate, 
            endDate: input.endDate,
            data: []
        });
    } catch (error) {
        console.error('runQualitativeAnalysis failed:', error);
        return { summary: 'Error analyzing data.', recurringSuccesses: [], commonChallenges: [], keyLearnings: [] };
    }
}



export async function omutoAI(input: OmutoAIInput): Promise<OmutoAIOutput> {
    // Use OpenRouter if configured
    if (aiConfig.provider === 'openrouter') {
        try {
            const systemMessage = `You are an expert assistant for the Omuto Foundation, a youth-led NGO in Uganda. Your name is Omuto AI.
            Be helpful, knowledgeable, and friendly. Be concise and actionable.`;
            
            const messages = [
                { role: 'system' as const, content: systemMessage },
                ...(input.history || []).map((h: { role: string; content?: { text: string }[] }) => ({
                    role: h.role as 'user' | 'assistant',
                    content: h.content?.[0]?.text || ''
                })),
                { role: 'user' as const, content: input.question }
            ];
            
            const answer = await chatWithOpenRouter(messages, 'openai/gpt-4o-mini');
            return { answer };
        } catch (error) {
            console.error('omutoAI OpenRouter failed:', error);
            return { answer: "I'm temporarily unable to reach the AI service right now. Please retry in a moment." };
        }
    }
    
    // Fall back to Gemini
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
