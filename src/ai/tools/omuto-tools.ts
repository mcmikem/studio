'use server';

/**
 * @fileOverview A collection of Genkit tools for accessing Omuto Foundation data.
 * IMPORTANT: These tools may use the Admin SDK and should only be used in server-side flows.
 */

import { ai } from '@/ai/genkit';
import { initializeFirebase } from '@/firebase/server';
import { collection, query, where, getDocs, serverTimestamp, doc, addDoc, getDoc, Timestamp, orderBy, limit } from 'firebase/firestore';
import { z } from 'zod';
import { PartnershipSchema, SearchResultItemSchema } from '@/lib/types';
import { format } from 'date-fns';
import { createAlert } from '../flows/create-alert-flow';


export const findGrantOpportunities = ai.defineTool(
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


export const findUsersByName = ai.defineTool(
    {
        name: 'findUsersByName',
        description: 'Finds staff members by their name.',
        inputSchema: z.object({
            name: z.string().describe("The name of the staff member to search for."),
        }),
        outputSchema: z.array(SearchResultItemSchema),
    },
    async ({ name }) => {
        const { firestore } = await initializeFirebase();
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

export const findProgramsByName = ai.defineTool(
    {
        name: 'findProgramsByName',
        description: 'Finds programs by their title.',
        inputSchema: z.object({
            title: z.string().describe("The title of the program to search for."),
        }),
        outputSchema: z.array(SearchResultItemSchema),
    },
    async ({ title }) => {
        const { firestore } = await initializeFirebase();
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


export const findExpensesByTitle = ai.defineTool(
    {
        name: 'findExpensesByTitle',
        description: 'Finds expense reports by their title.',
        inputSchema: z.object({
            title: z.string().describe("The title of the expense report to search for."),
        }),
        outputSchema: z.array(SearchResultItemSchema),
    },
    async ({ title }) => {
        const { firestore } = await initializeFirebase();
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

export const searchOmuto = ai.defineTool(
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
        // Run all searches in parallel for efficiency
        const [userResults, programResults, expenseResults] = await Promise.all([
            findUsersByName({ name: query }),
            findProgramsByName({ title: query }),
            findExpensesByTitle({ title: query }),
        ]);

        const combinedResults = [...userResults, ...programResults, ...expenseResults];
        
        // Ensure uniqueness of results, as some queries might be broad
        const uniqueResults = Array.from(new Map(combinedResults.map(item => [item.id, item])).values());
        
        console.log(`Found ${uniqueResults.length} unique results.`);
        return uniqueResults;
    }
);


export const createCheckout = ai.defineTool(
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
        const { firestore } = await initializeFirebase();

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

            // Create an alert for management
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


export const getActivitiesForProgram = ai.defineTool(
    {
        name: 'getActivitiesForProgram',
        description: 'Retrieves all activity reports for a specific program within a given date range.',
        inputSchema: z.object({
            programId: z.string().describe('The ID of the program to fetch activities for.'),
            startDate: z.string().describe('The start date of the range (YYYY-MM-DD).'),
            endDate: z.string().describe('The end date of the range (YYYY-MM-DD).'),
        }),
        outputSchema: z.array(z.any()), // We can be more specific, but 'any' is fine for the tool
    },
    async ({ programId, startDate, endDate }) => {
        const { firestore } = await initializeFirebase();
        
        const activitiesRef = collection(firestore, 'activities');
        const q = query(
            activitiesRef,
            where('primaryGoalType', '==', 'Program'),
            where('primaryGoalId', '==', programId),
            where('loggedAt', '>=', Timestamp.fromDate(new Date(startDate))),
            where('loggedAt', '<=', Timestamp.fromDate(new Date(endDate)))
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return [];
        }
        
        // Return serializable data
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Timestamps are not directly serializable for Genkit prompts, but we can pass the relevant text
            };
        });
    }
);

export const getRecentCheckouts = ai.defineTool(
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
        const { firestore } = await initializeFirebase();
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

export const getRecentCheckins = ai.defineTool(
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
        const { firestore } = await initializeFirebase();
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

export const getUpcomingEventsForUser = ai.defineTool(
    {
        name: 'getUpcomingEventsForUser',
        description: 'Retrieves the upcoming events for a specific user for the next 7 days.',
        inputSchema: z.object({
             userId: z.string().describe('The ID of the user.'),
        }),
        outputSchema: z.array(z.any()),
    },
    async ({ userId }) => {
        const { firestore } = await initializeFirebase();
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

export const getPendingTasksForUser = ai.defineTool(
    {
        name: 'getPendingTasksForUser',
        description: 'Retrieves the top 5 pending tasks for a specific user.',
        inputSchema: z.object({
             userId: z.string().describe('The ID of the user.'),
        }),
        outputSchema: z.array(z.any()),
    },
    async ({ userId }) => {
        const { firestore } = await initializeFirebase();
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
