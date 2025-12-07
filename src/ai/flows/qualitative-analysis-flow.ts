
'use server';

/**
 * @fileOverview An AI flow to analyze the qualitative data from program activities.
 */
import { ai } from '@/ai/genkit';
import type { QualitativeAnalysisInput, QualitativeAnalysisOutput } from '@/lib/types';
import { QualitativeAnalysisInputSchema, QualitativeAnalysisOutputSchema } from '@/lib/types';
import { getFirebaseAdmin } from '@/firebase/server';
import { collection, query, where } from 'firebase/firestore';
import { getDocs } from 'firebase/firestore';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/google-genai';

export async function analyzeProgramQualitativeData(input: QualitativeAnalysisInput): Promise<QualitativeAnalysisOutput> {
    const getActivitiesForProgramToolObject = ai.defineTool(
        {
            name: 'getActivitiesForProgram',
            description: 'Retrieves all activity reports for a specific program within a given date range.',
            inputSchema: z.object({
                programId: z.string().describe('The ID of the program to fetch activities for.'),
            }),
            outputSchema: z.array(z.any()), // We can be more specific, but 'any' is fine for the tool
        },
        async ({ programId }) => {
            const { firestore } = getFirebaseAdmin();
            const activitiesRef = collection(firestore, 'activities');
            const q = query(
                activitiesRef,
                where('primaryGoalType', '==', 'Program'),
                where('primaryGoalId', '==', programId)
            );

            const snapshot = await getDocs(q);
            if (snapshot.empty) {
                return [];
            }
            
            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                };
            });
        }
    );

    const qualitativeAnalysisPrompt = ai.definePrompt({
        name: 'qualitativeAnalysisPrompt',
        model: googleAI('gemini-1.5-flash-latest'),
        input: { schema: QualitativeAnalysisInputSchema },
        tools: [getActivitiesForProgramToolObject],
        output: { schema: QualitativeAnalysisOutputSchema },
        prompt: `You are an expert M&E (Monitoring and Evaluation) analyst for a youth-led NGO in Uganda.
        Your task is to analyze a collection of raw, qualitative data from field reports for a specific program and return a structured JSON object conforming to the schema.
        The data includes memorable moments, challenges, lessons learned, and direct quotes from beneficiaries.
        
        Synthesize this information into a high-level, thematic analysis.
        - Identify recurring themes of success. What is consistently going well?
        - Identify common challenges. What obstacles does the team repeatedly face?
        - Extract key, actionable learnings. What are the most important takeaways for improving the program?
        - Provide a concise executive summary of your findings.
        
        Focus on patterns and insights, not just listing individual comments. Be insightful and strategic.
        
        Analyze the qualitative data for the '{{programName}}' program from {{startDate}} to {{endDate}}. Use the 'getActivitiesForProgram' tool with programId '{{programId}}'.`,
    });
    
    const {output} = await qualitativeAnalysisPrompt(input);

    if (!output) {
        throw new Error("The AI failed to generate an analysis for the program's qualitative data.");
    }
    
    return output;
}
