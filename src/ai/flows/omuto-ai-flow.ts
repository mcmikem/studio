
/**
 * @fileOverview The main conversational AI agent for Omuto Central.
 * This flow acts as an expert assistant, knowledgeable about all aspects
 * of the Omuto Foundation's operations.
 */

import { ai } from '@/ai/genkit';
import {
  OmutoAIInputSchema,
  OmutoAIOutputSchema,
  type OmutoAIInput,
  type OmutoAIOutput,
} from '@/lib/types';
import { z } from 'zod';

const getRecentCheckoutsToolObject = ai.defineTool(
  {
    name: 'getRecentCheckouts',
    description: 'Retrieves the most recent daily checkout reports from the team to understand what they accomplished.',
    inputSchema: z.object({
      limit: z.number().optional().default(5),
    }),
    outputSchema: z.array(
      z.object({
        userName: z.string(),
        tasksCompleted: z.array(z.string()),
        keyLearning: z.string().optional(),
      })
    ),
  },
  async ({ limit }) => {
    try {
      const { getFirebaseAdmin } = await import('@/firebase/server');
      const { firestore } = getFirebaseAdmin();
      
      if (!firestore) {
        return [{ userName: 'System', tasksCompleted: [], keyLearning: 'Firestore not available' }];
      }
      
      const checkoutsRef = firestore.collection('checkouts');
      const snapshot = await checkoutsRef.orderBy('timestamp', 'desc').limit(limit).get();

      return snapshot.docs.map(doc => {
        const data = doc.data();
        const tasks = Array.isArray(data.tasks) ? data.tasks : [];
        return {
          userName: data.name || 'Unknown',
          tasksCompleted: tasks.filter((t: any) => t.status === 'Done').map((t: any) => t.description),
          keyLearning: data.learning,
        };
      });
    } catch (error) {
      console.error('[getRecentCheckouts] Error:', error);
      return [];
    }
  }
);

const omutoAIPrompt = ai.definePrompt({
    name: 'omutoAIPrompt',
    model: 'googleai/gemini-2.0-flash',
    tools: [getRecentCheckoutsToolObject],
    system: `You are an expert assistant for the Omuto Foundation, a youth-led NGO in Uganda. Your name is Omuto AI.
    Your personality is: Helpful, knowledgeable, and slightly formal but friendly.
    You have access to real-time data tools. Use them whenever a user asks a question that can be answered by the tool's description.
    When summarizing data, be concise and clear. Do not just list the data; synthesize it.`,
});

// --- FLOW DEFINITION ---

export const omutoAIFlow = ai.defineFlow(
  {
    name: 'omutoAIFlow',
    inputSchema: OmutoAIInputSchema,
    outputSchema: OmutoAIOutputSchema,
  },
  async (input: OmutoAIInput): Promise<OmutoAIOutput> => {
    try {
        console.log(`[OmutoAI] Processing question: "${input.question?.substring(0, 50)}..."`);

        const { history, question } = input;

        if (!question) {
          return { answer: "Please ask me a question!" };
        }

        const llmResponse = await omutoAIPrompt({
            history: history || [],
            input: question,
        });
        
        const answer = llmResponse?.text;
        
        if (!answer) {
            console.error("[OmutoAI] No text response from AI");
            return { answer: "I'm sorry, but I wasn't able to generate a response. Please try again." };
        }
        
        console.log('[OmutoAI] Response received, length:', answer.length);
        return { answer };

    } catch (error: any) {
        console.error('[OmutoAI] Error:', error?.message || error);
        const errorMessage = error?.message || 'Unknown error';
        
        if (errorMessage.includes('API key') || errorMessage.includes('not configured')) {
          return { answer: "The AI service is not configured. Please contact the administrator to set up the Gemini API key." };
        }
        
        return { answer: `I encountered an error: ${errorMessage}. Please try again.` };
    }
  }
);
