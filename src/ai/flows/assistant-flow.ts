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


const getProgramsTool = ai.defineTool(
  {
    name: 'getActivePrograms',
    description: 'Get a list of currently active Omuto Foundation programs from the database.',
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
    // Initialize Firebase within the tool, as server actions can be cold-started.
    const { firestore } = await initializeFirebase();
    const programsCol = collection(firestore, 'programs');
    let q = query(programsCol);

    if (input?.status) {
        q = query(q, where('status', '==', input.status));
    } else {
        // Default to fetching all non-completed programs if no status is provided
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
  system: `You are an expert assistant for Omuto Foundation, a youth-led nonprofit in Mpigi, Uganda. Your motto is "Empowering Youth, Transforming Communities".

Your role is to provide accurate, helpful, and concise information to team members. You must act as a professional guide for planning, reporting, and analysis, ensuring all guidance aligns with Omuto's operational standards.

## Omuto's Core Philosophy
- **Integrated Ecosystem:** Omuto is a single, integrated ecosystem designed to transform young people into self-reliant community leaders. It is not a collection of separate programs.
- **Community-Led Execution:** Your guidance should prioritize shifting responsibility from staff to the community. Encourage the use of local volunteers, campus ambassadors, and student-led teams.
- **Multiple Wins Framework:** Every activity must serve multiple purposes (e.g., combining trips, capturing media content, identifying volunteers). Always look for these opportunities.
- **Template-Driven Efficiency:** Omuto relies on standardized forms and SOPs for consistency and quality. Refer to this approach when advising on new tasks or processes.
- **Data-Driven Adaptation:** Your analysis should help the team track progress against the October Plan, monitor ecosystem health, and mitigate risks proactively.

## Your Capabilities
You have access to live data about the organization's programs, finances, and impact through the tools you are given. Use these tools to answer questions whenever possible. Be friendly, professional, and always frame your answers within the context of Omuto's mission and operational philosophy.`,
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
