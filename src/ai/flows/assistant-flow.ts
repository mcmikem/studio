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
  orderBy,
  limit
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
    const { firestore } = await initializeFirebase();
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

const getKeyResultsTool = ai.defineTool(
  {
      name: 'getOctoberKeyResults',
      description: "Get details about the Key Results (KRs) for Omuto's October Operational Plan.",
      inputSchema: z.object({
          priority: z.enum(['High', 'Medium', 'Low']).optional().describe('Filter KRs by priority level.'),
          krTitle: z.string().optional().describe('Get a specific KR by its title, e.g., "OCT-KR1".')
      }),
      outputSchema: z.array(z.object({
          title: z.string(),
          description: z.string(),
          currentProgress: z.number(),
          target: z.number(),
          deadline: z.string(),
          priority: z.string(),
      })),
  },
  async (input) => {
      const { firestore } = await initializeFirebase();
      const krCol = collection(firestore, 'key-results');
      let q = query(krCol);

      if (input?.priority) {
          q = query(q, where('priority', '==', input.priority));
      }
      if (input?.krTitle) {
          q = query(q, where('title', '==', input.krTitle));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
          const data = doc.data();
          return {
              title: data.title,
              description: data.description,
              currentProgress: data.currentProgress,
              target: data.target,
              deadline: data.deadline,
              priority: data.priority,
          }
      });
  }
);

const getPartnershipsTool = ai.defineTool(
    {
        name: 'getPartnerships',
        description: "Get information about Omuto's partner organizations.",
        inputSchema: z.object({
            status: z.enum(['Active', 'Potential', 'Inactive']).optional().describe('Filter partners by their status.'),
            name: z.string().optional().describe('Find a specific partner by name.'),
        }),
        outputSchema: z.array(z.object({
            name: z.string(),
            contactPerson: z.string(),
            contactEmail: z.string(),
            status: z.string(),
            nextStep: z.string(),
        })),
    },
    async (input) => {
        const { firestore } = await initializeFirebase();
        const partnersCol = collection(firestore, 'partnerships');
        let q = query(partnersCol);

        if (input?.status) {
            q = query(q, where('status', '==', input.status));
        }
        if (input?.name) {
            q = query(q, where('name', '==', input.name));
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                name: data.name,
                contactPerson: data.contactPerson,
                contactEmail: data.contactEmail,
                status: data.status,
                nextStep: data.nextStep,
            }
        });
    }
);

const getRecentCheckoutsTool = ai.defineTool(
    {
        name: 'getRecentCheckouts',
        description: "Get the most recent daily checkout updates from team members.",
        inputSchema: z.object({
            userName: z.string().optional().describe("Filter checkouts by a specific team member's name."),
            limit: z.number().optional().default(5).describe('The number of recent checkouts to retrieve.'),
        }),
        outputSchema: z.array(z.object({
            name: z.string(),
            task: z.string(),
            timestamp: z.string(),
        })),
    },
    async (input) => {
        const { firestore } = await initializeFirebase();
        const checkoutsCol = collection(firestore, 'checkouts');
        let q = query(checkoutsCol, orderBy('timestamp', 'desc'), limit(input.limit || 5));

        if (input?.userName) {
            q = query(q, where('name', '==', input.userName));
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                name: data.name,
                task: data.task,
                timestamp: data.timestamp.toDate().toLocaleString(),
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
You have access to live data about the organization's programs, finances, key results, partnerships, and recent team checkouts through the tools you are given. Use these tools to answer questions whenever possible. Be friendly, professional, and always frame your answers within the context of Omuto's mission and operational philosophy. For example, when asked to brainstorm, suggest ideas that align with the "Multiple Wins Framework".`,
  tools: [getProgramsTool, getKeyResultsTool, getPartnershipsTool, getRecentCheckoutsTool],
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
