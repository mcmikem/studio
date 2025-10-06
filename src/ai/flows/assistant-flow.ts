'use server';

/**
 * @fileOverview The main AI assistant flow for Omuto Central.
 * This assistant uses tools to access live data and provide contextual answers.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/server';

// Initialize Firebase for server-side use
const { firestore } = initializeFirebase();

const getProgramsTool = ai.defineTool(
  {
    name: 'getActivePrograms',
    description: 'Get a list of currently active Omuto Foundation programs.',
    inputSchema: z.object({
      status: z.enum(['On Track', 'At Risk', 'Delayed', 'Completed']).optional().describe('Filter programs by status.'),
    }),
    outputSchema: z.array(z.object({
        title: z.string(),
        lead: z.string(),
        status: z.string(),
        deadline: z.string(),
    })),
  },
  async (input) => {
    const programsCol = collection(firestore, 'programs');
    let q = query(programsCol);

    if (input?.status) {
        q = query(q, where('status', '==', input.status));
    } else {
        q = query(q, where('status', '!=', 'Completed'));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            title: data.title,
            lead: data.lead,
            status: data.status,
            deadline: data.deadline,
        }
    });
  }
);


const assistantPrompt = ai.definePrompt({
  name: 'assistantPrompt',
  system: `You are an expert assistant for the Omuto Foundation, a youth-focused non-profit in Uganda.
Your role is to provide accurate, helpful, and concise information to team members.
You have access to live data about the organization's programs, finances, and impact.
Use the provided tools to answer questions whenever possible.
Be friendly, professional, and always frame your answers within the context of Omuto's mission.`,
  tools: [getProgramsTool],
  output: {
    format: 'text'
  }
});

const assistantFlow = ai.defineFlow(
  {
    name: 'assistantFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (prompt) => {
    const llmResponse = await assistantPrompt.generate({
      prompt,
    });
    return llmResponse.text();
  }
);


export async function streamAssistant(prompt: string) {
    const { stream } = await assistantPrompt.generateStream({
      prompt,
    });
    return stream;
}