
'use server';

/**
 * @fileOverview An AI flow to analyze the qualitative data from program activities.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getActivitiesForProgram } from '../tools/omuto-tools';

const QualitativeAnalysisInputSchema = z.object({
  programId: z.string().describe('The ID of the program to analyze.'),
  programName: z.string().describe('The name of the program being analyzed.'),
  startDate: z.string().describe('The start date of the range to analyze (YYYY-MM-DD).'),
  endDate: z.string().describe('The end date of the range to analyze (YYYY-MM-DD).'),
});
export type QualitativeAnalysisInput = z.infer<typeof QualitativeAnalysisInputSchema>;


const QualitativeAnalysisOutputSchema = z.object({
  summary: z.string().describe("A high-level executive summary of the program's qualitative performance during the period."),
  recurringSuccesses: z.array(z.string()).describe("A list of common themes and successes identified from the reports."),
  commonChallenges: z.array(z.string()).describe("A list of recurring challenges or issues faced by the team."),
  keyLearnings: z.array(z.string()).describe("A list of actionable learnings and recommendations for improvement."),
});
export type QualitativeAnalysisOutput = z.infer<typeof QualitativeAnalysisOutputSchema>;


const analysisPrompt = ai.definePrompt({
    name: 'qualitativeAnalysisPrompt',
    system: `You are an expert M&E (Monitoring and Evaluation) analyst for a youth-led NGO in Uganda.
    Your task is to analyze a collection of raw, qualitative data from field reports for a specific program.
    The data includes memorable moments, challenges, lessons learned, and direct quotes from beneficiaries.
    
    Synthesize this information into a high-level, thematic analysis.
    - Identify recurring themes of success. What is consistently going well?
    - Identify common challenges. What obstacles does the team repeatedly face?
    - Extract key, actionable learnings. What are the most important takeaways for improving the program?
    - Provide a concise executive summary of your findings.
    
    Focus on patterns and insights, not just listing individual comments. Be insightful and strategic.`,
    tools: [getActivitiesForProgram],
    output: {
      schema: QualitativeAnalysisOutputSchema,
    },
});

export async function analyzeProgramQualitativeData(input: QualitativeAnalysisInput): Promise<QualitativeAnalysisOutput> {
    
    const initialResponse = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        prompt: `Analyze the qualitative data for the '${input.programName}' program from ${input.startDate} to ${input.endDate}. Use the 'getActivitiesForProgram' tool with programId '${input.programId}'.`,
        tools: [getActivitiesForProgram],
    });

    if (!initialResponse.hasToolRequest()) {
        throw new Error("The AI did not request the necessary tool to fetch program data.");
    }
    
    const toolRequest = initialResponse.toolRequest();
    const toolOutput = await toolRequest.run();

    const finalResponse = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        prompt: `Analyze the qualitative data for the '${input.programName}' program from ${input.startDate} to ${input.endDate}. Use the 'getActivitiesForProgram' tool with programId '${input.programId}'.`,
        history: [initialResponse, toolRequest.output(toolOutput)],
        tools: [getActivitiesForProgram],
    });

    const output = finalResponse.output;

    if (!output) {
        throw new Error("The AI failed to generate an analysis for the program's qualitative data.");
    }

    return output;
}
