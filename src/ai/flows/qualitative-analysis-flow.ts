
/**
 * @fileOverview An AI flow to analyze qualitative data from program activities.
 * Uses OpenRouter for AI generation
 */
import { callOpenRouter, DEFAULT_MODEL } from '@/lib/openrouter';
import { aiConfig } from '@/lib/ai';
import { QualitativeAnalysisInputSchema, QualitativeAnalysisOutputSchema } from '@/lib/types';

export async function analyzeQualitativeData(input: { programName: string; programId: string; startDate: string; endDate: string; data?: any[] }): Promise<{ summary: string; recurringSuccesses: string[]; commonChallenges: string[]; keyLearnings: string[] }> {
  const systemPrompt = `You are an expert M&E (Monitoring and Evaluation) analyst for a youth-led NGO in Uganda.
Analyze qualitative data and provide actionable insights.`;

  const prompt = `You are an expert M&E analyst. Analyze the following qualitative data from field reports.

Provide a JSON response with:
1. summary - Executive summary of findings
2. recurringSuccesses - Array of what's going well
3. commonChallenges - Array of obstacles faced
4. keyLearnings - Array of important takeaways

Data:
${JSON.stringify(input.data || [], null, 2).substring(0, 3000)}

Return JSON with summary, recurringSuccesses, commonChallenges, keyLearnings.`;

  if (aiConfig.provider === 'openrouter') {
    try {
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
      
      return {
        summary: 'Could not analyze data at this time',
        recurringSuccesses: [],
        commonChallenges: [],
        keyLearnings: []
      };
    } catch (error) {
      console.error('Qualitative analysis failed:', error);
      return {
        summary: 'Error analyzing data',
        recurringSuccesses: [],
        commonChallenges: [],
        keyLearnings: []
      };
    }
  }

  return {
    summary: 'AI not configured. Set up OpenRouter.',
    recurringSuccesses: [],
    commonChallenges: [],
    keyLearnings: []
  };
}
