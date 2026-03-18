
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

    ReceiptOCRInput,
    ReceiptOCROutput,
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
    const hasORKey = Boolean(aiConfig.openRouterApiKey);
    console.log(`[omutoAI] Start. Provider: ${aiConfig.provider}, OR Key: ${hasORKey}, Gemini Key: ${Boolean(aiConfig.geminiApiKey)}`);
    
    let lastError = '';
    
    // 1. Try OpenRouter (primary)
    if (aiConfig.openRouterApiKey) {
        try {
            const systemMessage = `You are an expert assistant for the Omuto Foundation, a youth-led NGO in Uganda. Your name is Omuto AI.
            Be helpful, knowledgeable, and friendly. Be concise and actionable.`;
            
            const historyMessages = Array.isArray(input.history) 
                ? input.history.map((h: any) => {
                    let text = '';
                    if (typeof h?.content === 'string') {
                      text = h.content;
                    } else if (Array.isArray(h?.content) && h.content[0]?.text) {
                      text = h.content[0].text;
                    } else if (typeof h?.text === 'string') {
                      text = h.text;
                    }
                    return {
                      role: (h?.role === 'model' ? 'assistant' : 'user') as 'user' | 'assistant',
                      content: text
                    };
                  }).filter((m: any) => m.content)
                : [];
            
            const messages = [
                { role: 'system' as const, content: systemMessage },
                ...historyMessages,
                { role: 'user' as const, content: input.question || '' }
            ];
            
            console.log(`[omutoAI] Sending to OpenRouter (model: ${DEFAULT_MODEL}, messages: ${messages.length})`);
            const answer = await chatWithOpenRouter(messages, DEFAULT_MODEL);
            if (answer && answer.trim()) {
                console.log('[omutoAI] OpenRouter success, length:', answer.length);
                return { answer };
            }
            lastError = 'OpenRouter returned empty response';
            console.warn('[omutoAI] OpenRouter returned empty, trying fallback');
        } catch (error: any) {
            lastError = `OpenRouter: ${error?.message || String(error)}`;
            console.error('[omutoAI] OpenRouter failed:', lastError);
        }
    } else {
        lastError = 'OpenRouter API key not configured';
    }
    
    // 2. Try Gemini (simplified flow — no history/tools to avoid Genkit crashes)
    if (aiConfig.geminiApiKey) {
        try {
            console.log('[omutoAI] Trying Gemini fallback');
            const result = await omutoAIFlow({ question: input.question, userId: input.userId });
            if (result?.answer && result.answer.trim()) {
                console.log('[omutoAI] Gemini success');
                return result;
            }
            lastError += ' | Gemini returned empty';
        } catch (error: any) {
            lastError += ` | Gemini: ${error?.message || String(error)}`;
            console.error('[omutoAI] Gemini fallback failed:', error?.message);
        }
    } else {
        lastError += ' | Gemini API key not configured';
    }
    
    // 3. All providers failed
    console.error('[omutoAI] All providers failed:', lastError);
    return {
        answer: `I'm temporarily unable to process your request. Debug: ${lastError.substring(0, 200)}`
    };
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

export async function processReceiptAction(input: ReceiptOCRInput): Promise<ReceiptOCROutput> {
  const { processReceipt } = await import('./flows/receipt-ocr-flow');
  return await processReceipt(input);
}
