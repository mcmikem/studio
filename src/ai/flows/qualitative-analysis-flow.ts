
'use server';

/**
 * @fileOverview An AI flow to analyze the qualitative data from program activities.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getActivitiesForProgramTool } from '../tools/omuto-tools';
import type { QualitativeAnalysisInput, QualitativeAnalysisOutput } from '@/lib/types';
import { QualitativeAnalysisOutputSchema } from '@/lib/types';


export async function analyzeProgramQualitativeData(input: QualitativeAnalysisInput): Promise<QualitativeAnalysisOutput> {
    
    const analysisPrompt = ai.definePrompt({
        name: 'qualitativeAnalysisPrompt',
        tools: [await getActivitiesForProgramTool()],
        prompt: `You are an expert M&E (Monitoring and Evaluation) analyst for a youth-led NGO in Uganda.
        Your task is to analyze a collection of raw, qualitative data from field reports for a specific program.
        The data includes memorable moments, challenges, lessons learned, and direct quotes from beneficiaries.

        Your entire output MUST be a single, valid JSON object that conforms to the following Zod schema:
        \`\`\`
        z.object({
            summary: z.string().describe("A high-level executive summary of the program's qualitative performance during the period."),
            recurringSuccesses: z.array(z.string()).describe("A list of common themes and successes identified from the reports."),
            commonChallenges: z.array(z.string()).describe("A list of recurring challenges or issues faced by the team."),
            keyLearnings: z.array(z.string()).describe("A list of actionable learnings and recommendations for improvement."),
        })
        \`\`\`
        
        Synthesize this information into a high-level, thematic analysis.
        - Identify recurring themes of success. What is consistently going well?
        - Identify common challenges. What obstacles does the team repeatedly face?
        - Extract key, actionable learnings. What are the most important takeaways for improving the program?
        - Provide a concise executive summary of your findings.
        
        Focus on patterns and insights, not just listing individual comments. Be insightful and strategic.

        Analyze the qualitative data for the '${input.programName}' program from ${input.startDate} to ${input.endDate}. Use the 'getActivitiesForProgram' tool with programId '${input.programId}'.`,
    });

    const llmResponse = await analysisPrompt();
    const text = llmResponse.text;

    if (!text) {
        throw new Error("The AI failed to generate an analysis for the program's qualitative data.");
    }

    try {
        const jsonText = text.trim().replace(/^```json|```$/g, '').trim();
        const parsed = JSON.parse(jsonText);
        return QualitativeAnalysisOutputSchema.parse(parsed);
    } catch(e) {
        console.error("Failed to parse AI response as JSON:", e);
        throw new Error('AI returned an invalid analysis format.');
    }
}
