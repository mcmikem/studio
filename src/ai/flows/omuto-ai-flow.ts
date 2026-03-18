
/**
 * @fileOverview The main conversational AI agent for Omuto Central.
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
    description: 'Retrieves the most recent daily checkout reports from the team.',
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
        return [];
      }
      
      const checkoutsRef = firestore.collection('checkouts');
      const snapshot = await checkoutsRef.orderBy('timestamp', 'desc').limit(limit || 5).get();

      return snapshot.docs.map(doc => {
        const data = doc.data();
        const tasks = Array.isArray(data.tasks) ? data.tasks : [];
        return {
          userName: data.name || 'Unknown',
          tasksCompleted: tasks.filter((t: any) => t.status === 'Done').map((t: any) => t.description || ''),
          keyLearning: data.learning || '',
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
    Be helpful, knowledgeable, and friendly. Be concise and actionable.`,
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
        const { history, question } = input;

        if (!question) {
          return { answer: "Please ask me a question!" };
        }

        console.log(`[OmutoAI] Question: "${question.substring(0, 50)}..."`);

        const llmResponse = await omutoAIPrompt({
            history: history || [],
            input: question,
        });
        
        // Genkit prompt response has .text as a getter property
        let answer = '';
        
        try {
          // .text is a getter on Genkit GenerateResponse
          const textValue = llmResponse.text;
          if (textValue && typeof textValue === 'string') {
            answer = textValue;
          } else if (llmResponse.output && typeof llmResponse.output === 'object') {
            const output = llmResponse.output as any;
            answer = output.answer || output.text || JSON.stringify(output);
          } else {
            answer = String(llmResponse);
          }
        } catch (parseError) {
          console.error('[OmutoAI] Error parsing response:', parseError);
          answer = '';
        }
        
        if (!answer || answer.trim() === '') {
            console.error("[OmutoAI] Empty response from AI");
            return { answer: "I didn't get a response. Please try again." };
        }
        
        console.log('[OmutoAI] Response received, length:', answer.length);
        return { answer };

    } catch (error: any) {
        console.error('[OmutoAI] Error:', error);
        
        const errorMessage = error?.message || String(error) || 'Unknown error';
        
        if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
          return { answer: "I'm receiving too many requests right now. Please wait a moment and try again." };
        }
        
        if (errorMessage.includes('API key') || errorMessage.includes('not configured')) {
          return { answer: "The AI service is not configured. Please contact the administrator." };
        }
        
        return { answer: `I encountered an error: ${errorMessage}. Please try again.` };
    }
  }
);
