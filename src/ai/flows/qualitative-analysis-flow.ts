
/**
 * @fileOverview An AI flow to analyze qualitative data from program activities.
 * Uses OpenRouter for AI generation
 */
import { callOpenRouter, DEFAULT_MODEL } from '@/lib/openrouter';
import { aiConfig } from '@/lib/ai';
import { QualitativeAnalysisInputSchema, QualitativeAnalysisOutputSchema } from '@/lib/types';

import { ai } from '@/ai/genkit';

const qualitativeParserPrompt = ai.definePrompt({
  name: 'qualitativeParserPrompt',
  model: 'googleai/gemini-2.0-flash',
  system: `You are an expert M&E (Monitoring and Evaluation) analyst for a youth-led NGO in Uganda. Analyze qualitative data and provide actionable insights.`,
  output: {
    schema: QualitativeAnalysisOutputSchema
  }
});

export async function analyzeQualitativeData(input: { programName: string; programId: string; startDate: string; endDate: string; data?: any[] }): Promise<{ summary: string; recurringSuccesses: string[]; commonChallenges: string[]; keyLearnings: string[] }> {
  const prompt = `Analyze the following qualitative data from field reports for program "${input.programName}":\n\n${JSON.stringify(input.data || [], null, 2).substring(0, 3000)}\n\nReturn JSON with summary, recurringSuccesses, commonChallenges, keyLearnings.`;

  // 1. Try OpenRouter First
  if (aiConfig.provider === 'openrouter' && aiConfig.openRouterApiKey) {
    try {
      const systemPrompt = `You are an expert M&E analyst for a youth-led NGO in Uganda. Return valid JSON only.`;
      const text = await callOpenRouter(prompt, systemPrompt, DEFAULT_MODEL, 0.5);
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary || 'Analysis complete',
          recurringSuccesses: parsed.recurringSuccesses || [],
          commonChallenges: parsed.commonChallenges || [],
          keyLearnings: parsed.keyLearnings || []
        };
      }
    } catch (error) {
      console.error('Qualitative analysis OpenRouter failed:', error);
    }
  }

  // 2. Try Gemini
  try {
    console.log('[QualitativeAnalysis] Attempting Gemini fallback');
    const response = await qualitativeParserPrompt({ input: prompt });
    if (response.output) {
      return response.output as { summary: string; recurringSuccesses: string[]; commonChallenges: string[]; keyLearnings: string[] };
    }
  } catch (error) {
    console.error('Qualitative analysis Gemini failed:', error);
  }

  return {
    summary: 'AI analysis unavailable at this time',
    recurringSuccesses: [],
    commonChallenges: [],
    keyLearnings: []
  };
}
