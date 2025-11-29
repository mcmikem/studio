/**
 * @fileOverview This file contains the actual definitions of the Genkit tools and prompts.
 * It does NOT use the 'use server' directive and can safely export the tool/prompt objects.
 * The server actions in the /flows directory will import these definitions.
 */

import { ai } from '@/ai/genkit';
import { getFirebaseAdmin } from '@/firebase/server';
import { collection, query, where, getDocs, serverTimestamp, doc, addDoc, getDoc, Timestamp, orderBy, limit } from 'firebase/firestore';
import { z } from 'zod';
import { SearchResultItemSchema, DailyPlannerAIInputSchema, DailyPlannerAIOutputSchema, GrantFinderOutputSchema, QualitativeAnalysisInputSchema, QualitativeAnalysisOutputSchema, SmartRemindersOutputSchema } from '@/lib/types';
import { format } from 'date-fns';
import { createAlert } from './flows/create-alert-flow';
import { KNOWLEDGE_BASE } from '@/lib/data';

// --- TOOL DEFINITIONS ---

export const findGrantOpportunitiesToolObject = ai.defineTool(
    {
        name: 'findGrantOpportunities',
        description: 'Searches for grant and funding opportunities based on a query. This is a simulation and will return mock data.',
        inputSchema: z.object({
        query: z.string().describe('The search query, e.g., "youth empowerment uganda"'),
        }),
        outputSchema: z.array(
        z.object({
            title: z.string(),
            funder: z.string(),
            description: z.string(),
            amount: z.number(),
            deadline: z.string().describe("YYYY-MM-DD format"),
        })
        ),
    },
    async ({ query }) => {
        // This is a MOCK implementation. In a real app, this would call a real search API.
        console.log(`Simulating search for grant opportunities with query: "${query}"`);
        const MOCK_OPPORTUNITIES = [
        {
            title: 'Youth Empowerment & Skilling Grant 2025',
            funder: 'Global Youth Fund',
            description: 'Supports projects focused on vocational training and entrepreneurship for young people in East Africa.',
            amount: 50000000,
            deadline: '2025-12-15',
        },
        {
            title: 'Community Climate Action Fund',
            funder: 'Green Future Foundation',
            description: 'Provides funding for grassroots environmental projects, including tree planting and conservation education.',
            amount: 25000000,
            deadline: '2025-11-30',
        },
        {
            title: 'Digital Literacy for Rural Girls',
            funder: 'TechForShe',
            description: 'A grant for organizations providing digital skills and access to technology for girls in rural areas.',
            amount: 75000000,
            deadline: '2026-01-20',
        },
        {
            title: 'Menstrual Health Equity Grant',
            funder: 'Dignity for All Foundation',
            description: 'Funding for projects addressing menstrual health education and access to sanitary products.',
            amount: 30000000,
            deadline: '2025-12-01',
        },
        ];
        // Simple filter to make the mock data slightly responsive to the query
        return MOCK_OPPORTUNITIES.filter(op => op.description.toLowerCase().includes(query.split(' ')[0].toLowerCase()));
    }
);

export const findUsersByNameToolObject = ai.defineTool(
    {
        name: 'findUsersByName',
        description: 'Finds staff members by their name.',
        inputSchema: z.object({
            name: z.string().describe("The name of the staff member to search for."),
        }),
        outputSchema: z.array(SearchResultItemSchema),
    },
    async ({ name }) => {
        const { firestore } = getFirebaseAdmin();
        const usersRef = collection(firestore, 'users');
        
        const q = query(
            usersRef,
            where('name', '>=', name),
            where('name', '<=', name + '\uf8ff')
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return [];
        }

        return snapshot.docs.map(doc => ({
            id: doc.id,
            type: 'User',
            title: doc.data().name,
            url: `/profile?userId=${doc.id}`,
        }));
    }
);

export const findProgramsByNameToolObject = ai.defineTool(
    {
        name: 'findProgramsByName',
        description: 'Finds programs by their title.',
        inputSchema: z.object({
            title: z.string().describe("The title of the program to search for."),
        }),
        outputSchema: z.array(SearchResultItemSchema),
    },
    async ({ title }) => {
        const { firestore } = getFirebaseAdmin();
        const programsRef = collection(firestore, 'programs');
        
        const q = query(
            programsRef,
            where('title', '>=', title),
            where('title', '<=', title + '\uf8ff')
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return [];
        }

        return snapshot.docs.map(doc => ({
            id: doc.id,
            type: 'Program',
            title: doc.data().title,
            url: `/management/programs`,
        }));
    }
);

export const findExpensesByTitleToolObject = ai.defineTool(
    {
        name: 'findExpensesByTitle',
        description: 'Finds expense reports by their title.',
        inputSchema: z.object({
            title: z.string().describe("The title of the expense report to search for."),
        }),
        outputSchema: z.array(SearchResultItemSchema),
    },
    async ({ title }) => {
        const { firestore } = getFirebaseAdmin();
        const expensesRef = collection(firestore, 'expenses');
        
        const q = query(
            expensesRef,
            where('title', '>=', title),
            where('title', '<=', title + '\uf8ff')
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return [];
        }

        return snapshot.docs.map(doc => ({
            id: doc.id,
            type: 'Expense',
            title: doc.data().title,
            url: `/management/expenses?highlight=${doc.id}`,
        }));
    }
);

export const searchOmutoToolObject = ai.defineTool(
    {
        name: 'searchOmuto',
        description: 'Performs a global search across users, programs, and expenses to find information within the Omuto Central app.',
        inputSchema: z.object({
            query: z.string().describe("The user's natural language search query."),
        }),
        outputSchema: z.array(SearchResultItemSchema),
    },
    async ({ query }) => {
        console.log(`Searching Omuto for: ${query}`);
        // In a real scenario, you'd call findUsersByNameToolObject, etc.
        const users = await findUsersByNameToolObject.fn({ name: query });
        const programs = await findProgramsByNameToolObject.fn({ title: query });
        const expenses = await findExpensesByTitleToolObject.fn({ title: query });

        const combined = [...users, ...programs, ...expenses];
        const uniqueResults = Array.from(new Map(combined.map(item => [item.id, item])).values());
        
        console.log(`Found ${uniqueResults.length} unique results.`);
        return uniqueResults;
    }
);

export const createCheckoutToolObject = ai.defineTool(
    {
        name: 'createCheckout',
        description: 'Creates an end-of-day checkout report for a user.',
        inputSchema: z.object({
            userId: z.string().describe("The ID of the user submitting the report."),
            task: z.string().describe("The summary of what the user accomplished today."),
            learning: z.string().optional().describe("The user's key learning or adaptation."),
            tomorrowPlan: z.string().optional().describe("The user's top priority for tomorrow."),
        }),
        outputSchema: z.object({
            success: z.boolean(),
            message: z.string(),
        })
    },
    async ({ userId, task, learning, tomorrowPlan }) => {
        const { firestore } = getFirebaseAdmin();
        try {
            const userRef = doc(firestore, 'users', userId);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                return { success: false, message: `Could not find user with ID ${userId}.`};
            }
            const userProfile = userSnap.data();

            const checkoutData = {
                userId,
                tasks: [{ description: task, status: 'Done' }],
                learning: learning || "",
                tomorrowPlan: tomorrowPlan || "",
                name: userProfile.name,
                role: userProfile.role,
                avatar: userProfile.photoURL || '',
                timestamp: serverTimestamp(),
            };

            await addDoc(collection(firestore, 'checkouts'), checkoutData);

            await createAlert({
                type: 'Info',
                priority: 'Low',
                message: `${userProfile.name} has submitted their end-of-day report.`,
                action: '/stream',
                creatorId: userId,
            });

            return { success: true, message: `Successfully submitted the checkout report for ${userProfile.name}.` };
        } catch (error: any) {
            console.error("Error creating checkout:", error);
            return { success: false, message: `Failed to create checkout: ${error.message}` };
        }
    }
);

export const getActivitiesForProgramToolObject = ai.defineTool(
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

export const getRecentCheckoutsToolObject = ai.defineTool(
    {
        name: 'getRecentCheckouts',
        description: 'Retrieves the most recent end-of-day checkout reports from the team.',
        inputSchema: z.object({
            count: z.number().optional().default(5).describe('The number of recent checkouts to retrieve.'),
        }),
        outputSchema: z.array(
            z.object({
                name: z.string(),
                tasks: z.array(z.object({ description: z.string(), status: z.string() })),
                learning: z.string().optional(),
                tomorrowPlan: z.string().optional(),
            })
        ),
    },
    async ({ count }) => {
        const { firestore } = getFirebaseAdmin();
        const checkoutsRef = collection(firestore, 'checkouts');
        const q = query(
            checkoutsRef,
            orderBy('timestamp', 'desc'),
            limit(count)
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return [];
        }

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                name: data.name,
                tasks: Array.isArray(data.tasks) ? data.tasks : [{ description: data.task, status: 'Done'}],
                learning: data.learning,
                tomorrowPlan: data.tomorrowPlan,
            };
        });
    }
);

export const getRecentCheckinsToolObject = ai.defineTool(
    {
        name: 'getRecentCheckins',
        description: "Retrieves today's start-of-day check-in reports from the team.",
        inputSchema: z.object({
            count: z.number().optional().default(10).describe('The number of recent check-ins to retrieve.'),
        }),
        outputSchema: z.array(
            z.object({
                name: z.string(),
                primaryMission: z.string(),
            })
        ),
    },
    async ({ count }) => {
        const { firestore } = getFirebaseAdmin();
        const checkinsRef = collection(firestore, 'checkins');
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfToday = Timestamp.fromDate(today);

        const q = query(
            checkinsRef,
            where('timestamp', '>=', startOfToday),
            orderBy('timestamp', 'desc'),
            limit(count)
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return [];
        }

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                name: data.name,
                primaryMission: data.primaryMission,
            };
        });
    }
);

export const getUpcomingEventsForUserToolObject = ai.defineTool(
    {
        name: 'getUpcomingEventsForUser',
        description: 'Retrieves the upcoming events for a specific user for the next 7 days.',
        inputSchema: z.object({
             userId: z.string().describe('The ID of the user.'),
        }),
        outputSchema: z.array(z.any()),
    },
    async ({ userId }) => {
        const { firestore } = getFirebaseAdmin();
        const today = new Date();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(today.getDate() + 7);

        const eventsQuery = query(
            collection(firestore, 'events'),
            where('date', '>=', Timestamp.fromDate(today)),
            where('date', '<=', Timestamp.fromDate(sevenDaysFromNow)),
            orderBy('date', 'asc')
        );

        const snapshot = await getDocs(eventsQuery);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
            title: data.title,
            date: format(data.date.toDate(), 'eeee, MMM d'),
            category: data.category,
            responsible: data.responsible,
            };
        });
    }
);

export const getPendingTasksForUserToolObject = ai.defineTool(
    {
        name: 'getPendingTasksForUser',
        description: 'Retrieves the top 5 pending tasks for a specific user.',
        inputSchema: z.object({
             userId: z.string().describe('The ID of the user.'),
        }),
        outputSchema: z.array(z.any()),
    },
    async ({ userId }) => {
        const { firestore } = getFirebaseAdmin();
        const tasksQuery = query(
            collection(firestore, 'users', userId, 'tasks'),
            where('completed', '==', false),
            orderBy('createdAt', 'desc'),
            limit(5)
        );

        const snapshot = await getDocs(tasksQuery);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
            title: data.title,
            dueDate: data.dueDate ? format(new Date(data.dueDate), 'eeee, MMM d') : undefined,
            };
        });
    }
);


// --- PROMPT DEFINITIONS ---

export const dailyPlannerPrompt = ai.definePrompt(
    {
      name: 'dailyPlannerPrompt',
      input: { schema: DailyPlannerAIInputSchema },
      output: { schema: DailyPlannerAIOutputSchema },
      model: 'googleai/gemini-1.5-flash',
      prompt: `You are an expert productivity coach for Omuto Foundation, a youth-led NGO in Uganda. Your goal is to generate a structured, strategic daily plan in JSON format. You are a coach, not just a scheduler.

      Here is the organizational knowledge base to draw from:
      ---
      ${KNOWLEDGE_BASE}
      ---
      
      A staff member with the role '{{userRole}}' needs a strategic daily plan. Their main focus for today is: "{{primaryMission}}".

      {{#if weeklyPriorities}}
      Their personal priorities for this week are: {{#each weeklyPriorities}}- {{{this}}} {{/each}}.
      {{/if}}

      CURRENT ORGANIZATIONAL KEY RESULTS (Summary):
      {{#if keyResults}}
      {{#each keyResults}}
      - {{this.title}}: {{this.description}} (Deadline: {{this.deadline}})
      {{/each}}
      {{/if}}

      Your task is to generate a structured JSON object based on the schema provided.

      1.  **Time Blocks:** Break down the user's primary mission into a series of specific, actionable tasks. Assign each task to a logical time block. The 'description' for each time block MUST be a concrete to-do item (e.g., "Draft the first section of the RED Campaign report" or "Call 3 potential partners from the list"). Do NOT put coaching questions or general advice in the description field. Make sure your tasks directly relate to the user's stated primary mission.
      2.  **Multi-Win Connections:** Explicitly connect the daily mission to AT LEAST TWO specific weekly priorities (if available) or organizational Key Results from the provided list. Use the "Integrated Activity Framework" and "Individual Accountability" sections of the knowledge base to find these connections. For example, if the mission is 'Finalize Dignity Pads production', a connection would be 'Contributes to KR1: Clear October Backlogs'. This is critical for strategic alignment.
      3.  **Materials:** List specific, tangible items needed (e.g., "Updated partners spreadsheet," "Camera with charged battery").
      4.  **Challenges & Mitigations:** Proactively identify at least one potential challenge from the "Risk Management" section of the knowledge base that is relevant to the user's mission. Provide the concrete mitigation strategy listed in the plan. This is active risk management. Example: "Challenge: Partner may be unavailable. Mitigation: Send a confirmation WhatsApp message one hour before the meeting."
      5.  **Best Practice:** Provide ONE single, highly relevant piece of advice from the knowledge base that helps the staff member think more strategically about their task today.`,
    }
);

export const grantFinderPrompt = ai.definePrompt(
      {
        name: 'grantFinderPrompt',
        tools: [findGrantOpportunitiesToolObject],
        output: { schema: GrantFinderOutputSchema },
        model: 'googleai/gemini-pro',
        prompt: `You are an expert at summarizing grant opportunities. The user will provide a query, and you will receive a list of potential grants from a search tool. Your job is to analyze the tool's output and present the most relevant opportunities in a clear, structured JSON format that conforms to the provided schema. Do not add any grants that are not from the tool output.
        
        Please find grant opportunities related to the following query: "{{query}}"`,
      }
);

export const qualitativeAnalysisPrompt = ai.definePrompt({
    name: 'qualitativeAnalysisPrompt',
    input: { schema: QualitativeAnalysisInputSchema },
    tools: [getActivitiesForProgramToolObject],
    output: { schema: QualitativeAnalysisOutputSchema },
    model: 'googleai/gemini-pro',
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


export const smartRemindersPrompt = ai.definePrompt(
      {
        name: 'smartRemindersPrompt',
        tools: [getUpcomingEventsForUserToolObject, getPendingTasksForUserToolObject],
        output: { schema: SmartRemindersOutputSchema },
        model: 'googleai/gemini-pro',
        prompt: `You are a proactive, intelligent assistant and performance coach for the Omuto Foundation, a youth-led NGO in Uganda. Your goal is to help team members stay on track by providing smart, actionable reminders based on their current context. Your output must be a JSON object conforming to the schema.

        Your reminders should be:
        - **Concise & Actionable**: Direct and to the point.
        - **Context-Aware**: Directly reference the user's tasks, events, and role.
        - **Strategically Aligned**: Connect daily tasks to broader Omuto goals (like Key Results from the October Plan) and the "Multiple Wins" framework.
        - **Encouraging & Supportive**: Sound like a helpful teammate, not a corporate robot.
        
        Analyze the user's upcoming events and pending tasks from the provided tool outputs. Provide a specific, helpful list of 3-4 smart, actionable reminders.

        Now, generate the reminders for {{userName}} (Role: {{userRole}}). Use the getUpcomingEventsForUser and getPendingTasksForUser tools with userId '{{userId}}' to get the necessary data.`,
      }
    );

