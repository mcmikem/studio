
'use server';

/**
 * @fileOverview An AI flow to analyze the qualitative data from program activities.
 */
import type { QualitativeAnalysisInput, QualitativeAnalysisOutput } from '@/lib/types';
import { qualitativeAnalysisPrompt } from '@/ai/definitions';


export async function analyzeProgramQualitativeData(input: QualitativeAnalysisInput): Promise<QualitativeAnalysisOutput> {
    
    const {output} = await qualitativeAnalysisPrompt(input);

    if (!output) {
        throw new Error("The AI failed to generate an analysis for the program's qualitative data.");
    }
    
    return output;
}
