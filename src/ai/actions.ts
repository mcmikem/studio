
'use server';

import { omutoAIFlow } from './flows/omuto-ai-flow';
import { chatWithOpenRouter, DEFAULT_MODEL } from '@/lib/openrouter';
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
    console.log('[omutoAI] Provider:', aiConfig.provider, 'Is configured:', aiConfig.isConfigured);
    
    // 1. Try OpenRouter if it's the active provider and configured
    if (aiConfig.provider === 'openrouter' && aiConfig.openRouterApiKey) {
        try {
            const systemMessage = `You are an expert assistant for the Omuto Foundation, a youth-led NGO in Uganda. Your name is Omuto AI.
            Be helpful, knowledgeable, and friendly. Be concise and actionable.`;
            
            const historyMessages = Array.isArray(input.history) 
                ? input.history.map((h: any) => ({
                    role: (h?.role === 'model' ? 'assistant' : 'user') as 'user' | 'assistant',
                    content: h?.content?.[0]?.text || h?.content || ''
                }))
                : [];
            
            const messages = [
                { role: 'system' as const, content: systemMessage },
                ...historyMessages,
                { role: 'user' as const, content: input.question || '' }
            ];
            
            console.log('[omutoAI] Sending request to OpenRouter');
            const answer = await chatWithOpenRouter(messages, DEFAULT_MODEL);
            if (answer) return { answer };
        } catch (error: any) {
            console.error('omutoAI OpenRouter failed:', error?.message || error);
            // Don't return yet, try fallback
        }
    }
    
    // 2. Try Gemini Flow (Genkit) if configured
    try {
        console.log('[omutoAI] Attempting Gemini Flow fallback');
        return await omutoAIFlow(input);
    } catch (error: any) {
        console.error('omutoAI Gemini fallback failed:', error?.message || error);
        return {
            answer: "I'm temporarily unable to reach the AI service right now. Please check your API configuration or retry in a moment."
        };
    }
}





export async function runImpactStoryGenerator(input: ImpactStoryInput) {
  return generateImpactStory(input);
}

export async function runTestimonyProcessor(input: TestimonyInput) {
  return processTestimony(input);
}

export async function getEnterpriseInsightsAction(input: { sales: any[]; inventory: any[]; production: any[] }) {
  const { getEnterpriseInsights } = await import('@/ai/flows/enterprise-advisor-flow');
  return await getEnterpriseInsights(input);
}
