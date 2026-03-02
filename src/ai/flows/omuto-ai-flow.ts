
/**
 * @fileOverview The main conversational AI agent for Omuto Central.
 * This flow acts as an expert assistant, knowledgeable about all aspects
 * of the Omuto Foundation's operations.
 */

import { ai } from '@/ai/genkit';
import {
  SearchResultItemSchema,
  OmutoAIInputSchema,
  OmutoAIOutputSchema,
  type OmutoAIInput,
  type OmutoAIOutput,
} from '@/lib/types';
import { z } from 'zod';
import { getFirebaseAdmin } from '@/firebase/server';
import { Timestamp } from 'firebase-admin/firestore';


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
    const { firestore } = getFirebaseAdmin();
    const checkoutsRef = firestore.collection('checkouts');
    const snapshot = await checkoutsRef.orderBy('timestamp', 'desc').limit(limit).get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      // Ensure tasks is an array and handle potential missing data
      const tasks = Array.isArray(data.tasks) ? data.tasks : [];
      return {
        userName: data.name,
        tasksCompleted: tasks.filter(t => t.status === 'Done').map(t => t.description),
        keyLearning: data.learning,
      };
    });
  }
);

const omutoAIPrompt = ai.definePrompt({
    name: 'omutoAIPrompt',
    model: 'googleai/gemini-flash-latest',
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
        console.log(`omutoAIFlow invoked with question: "${input.question}"`);

        const { history, userId, question } = input;

        const llmResponse = await omutoAIPrompt({
            history: history || [],
            input: question,
        });
        
        const answer = llmResponse.text;
        
        if (!answer) {
            console.error("AI did not return a text response.", { llmResponse });
            return { answer: "I'm sorry, but I wasn't able to generate a response. Please try again." };
        }
        
        console.log('omutoAIFlow completed successfully.');
        return { answer };

    } catch (error) {
        console.error('Error executing omutoAIFlow:', error);
        return { answer: "An unexpected error occurred. I've logged the issue for the technical team to review." };
    }
  }
);
