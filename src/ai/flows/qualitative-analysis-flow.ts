
'use server';

/**
 * @fileOverview An AI flow to analyze the qualitative data from program activities.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getActivitiesForProgramTool } from '../tools/omuto-tools';
import { googleAI } from '@genkit-ai/google-genai';
import type { QualitativeAnalysisInput, QualitativeAnalysisOutput } from '@/lib/types';
import { QualitativeAnalysisOutputSchema } from '@/lib/types';


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
    output: {
      schema: QualitativeAnalysisOutputSchema,
    },
});

export async function analyzeProgramQualitativeData(input: QualitativeAnalysisInput): Promise<QualitativeAnalysisOutput> {
    
    const llmResponse = await ai.generate({
        model: googleAI.model('gemini-2.5-flash'),
        prompt: `Analyze the qualitative data for the '${input.programName}' program from ${input.startDate} to ${input.endDate}. Use the 'getActivitiesForProgram' tool with programId '${input.programId}'.`,
        tools: [await getActivitiesForProgramTool()],
    });

    const output = llmResponse.output();

    if (!output) {
        throw new Error("The AI failed to generate an analysis for the program's qualitative data.");
    }

    return output;
}
