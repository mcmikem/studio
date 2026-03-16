
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
    console.log('[omutoAI] Provider:', aiConfig.provider, 'Is configured:', aiConfig.isConfigured);
    
    // Try OpenRouter first
    if (aiConfig.provider === 'openrouter' || aiConfig.isConfigured) {
        try {
            const systemMessage = `You are an expert assistant for the Omuto Foundation, a youth-led NGO in Uganda. Your name is Omuto AI.
            Be helpful, knowledgeable, and friendly. Be concise and actionable.`;
            
            // Safely handle history
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
            
            console.log('[omutoAI] Sending request to OpenRouter, messages:', messages.length);
            
            const answer = await chatWithOpenRouter(messages, 'openai/gpt-4o-mini');
            return { answer };
        } catch (error: any) {
            console.error('omutoAI OpenRouter failed:', error?.message || error);
            return { answer: "I'm temporarily unable to reach the AI service right now. Please retry in a moment." };
        }
    }
    
    // Fall back - try old flow but catch any errors
    try {
        return await omutoAIFlow(input);
    } catch (error: any) {
        console.error('omutoAI fallback failed:', error?.message || error);
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
