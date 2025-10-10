
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
  limit,
  Timestamp,
  startOfWeek,
  endOfWeek,
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/server';
import { KNOWLEDGE_BASE } from '@/lib/data';
import { getAuth } from 'firebase-admin/auth';
import type { Task } from '@/lib/types';


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
    try {
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
    } catch(e) {
        console.error("Error fetching active programs:", e);
        return [];
    }
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
    try {
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
    } catch(e) {
        console.error("Error fetching key results:", e);
        return [];
    }
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
        try {
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
        } catch(e) {
            console.error("Error fetching partnerships:", e);
            return [];
        }
    }
);

const formatDateSafe = (dateValue: any) => {
  if (!dateValue) return 'N/A';
  try {
    if (dateValue instanceof Timestamp) {
        return dateValue.toDate().toLocaleString();
    }
    if (typeof dateValue === 'string') {
        return new Date(dateValue).toLocaleString();
    }
    if (dateValue.toDate && typeof dateValue.toDate === 'function') {
        return dateValue.toDate().toLocaleString();
    }
  } catch (e) {
    // fall through
  }
  return 'Invalid Date';
};


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
        try {
            const { firestore } = await initializeFirebase();
            const checkoutsCol = collection(firestore, 'checkouts');
            
            let q;
            if (input?.userName) {
                 q = query(checkoutsCol, where('name', '==', input.userName), orderBy('timestamp', 'desc'), limit(input.limit || 5));
            } else {
                 q = query(checkoutsCol, orderBy('timestamp', 'desc'), limit(input.limit || 5));
            }

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    name: data.name,
                    task: data.task,
                    timestamp: formatDateSafe(data.timestamp),
                }
            });
        } catch(e) {
            console.error("Error fetching recent checkouts:", e);
            return [];
        }
    }
);

const getWeeklyWorkplanTool = ai.defineTool({
    name: 'getWeeklyWorkplan',
    description: "Get the current user's key priorities for this week from their weekly workplan.",
    inputSchema: z.object({ userId: z.string().describe("The ID of the user asking.") }),
    outputSchema: z.array(z.string()),
    },
    async ({ userId }) => {
        try {
            const { firestore } = await initializeFirebase();
            const today = new Date();
            const start = startOfWeek(today, { weekStartsOn: 1 });

            const q = query(
                collection(firestore, 'workplans'),
                where('userId', '==', userId),
                where('weekOf', '>=', Timestamp.fromDate(start)),
                limit(1)
            );
            const snapshot = await getDocs(q);
            if (snapshot.empty) {
                return ["No workplan found for this week. Please create one in the 'Weekly Workplan' section."];
            }
            return snapshot.docs[0].data().keyPriorities || [];
        } catch (e) {
            console.error("Error fetching weekly workplan:", e);
            return ["Error fetching workplan."];
        }
});

const getExpenseReportsTool = ai.defineTool({
    name: 'getExpenseReports',
    description: "Get a list of expense reports, optionally filtered by status or user.",
    inputSchema: z.object({
        status: z.enum(['Pending', 'Approved', 'Rejected', 'Cleared']).optional().describe('Filter expenses by status.'),
        userName: z.string().optional().describe("Filter expenses by the user's name."),
    }),
    outputSchema: z.array(z.object({
        title: z.string(),
        userName: z.string(),
        totalAmount: z.number(),
        status: z.string(),
    })),
    },
    async (input) => {
        try {
            const { firestore } = await initializeFirebase();
            const expensesCol = collection(firestore, 'expenses');
            let q = query(expensesCol, orderBy('createdAt', 'desc'));

            if (input.status) {
                q = query(q, where('status', '==', input.status));
            }
            if (input.userName) {
                q = query(q, where('userName', '==', input.userName));
            }

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    title: data.title,
                    userName: data.userName,
                    totalAmount: data.totalAmount,
                    status: data.status,
                };
            });
        } catch (e) {
            console.error("Error fetching expense reports:", e);
            return [];
        }
});

const getUserTasksTool = ai.defineTool({
    name: 'getUserTasks',
    description: "Get the current user's personal tasks from their to-do list.",
    inputSchema: z.object({ 
        userId: z.string().describe("The ID of the user asking."),
        completed: z.boolean().optional().describe("Filter tasks by completion status. Defaults to false (pending).")
     }),
    outputSchema: z.array(z.object({
        title: z.string(),
        completed: z.boolean(),
        dueDate: z.string().optional(),
    })),
    },
    async ({ userId, completed = false }) => {
        try {
            const { firestore } = await initializeFirebase();
            const tasksCol = collection(firestore, 'users', userId, 'tasks');
            const q = query(tasksCol, where('completed', '==', completed), orderBy('createdAt', 'desc'));

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => {
                const data = doc.data() as Task;
                return {
                    title: data.title,
                    completed: data.completed,
                    dueDate: data.dueDate,
                };
            });
        } catch (e) {
            console.error("Error fetching user tasks:", e);
            return [];
        }
});

export const assistantFlow = ai.defineFlow(
  {
    name: 'assistantFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (prompt) => {
    
    const llmResponse = await ai.generate({
      prompt: prompt,
      system: KNOWLEDGE_BASE,
      tools: [getProgramsTool, getKeyResultsTool, getPartnershipsTool, getRecentCheckoutsTool, getWeeklyWorkplanTool, getExpenseReportsTool, getUserTasksTool],
    });
    
    return llmResponse.text;
  }
);


export async function streamAssistant(prompt: string) {
    const { stream } = ai.generateStream({
        prompt: prompt,
        system: KNOWLEDGE_BASE,
        tools: [getProgramsTool, getKeyResultsTool, getPartnershipsTool, getRecentCheckoutsTool, getWeeklyWorkplanTool, getExpenseReportsTool, getUserTasksTool],
    });
    return stream;
}
