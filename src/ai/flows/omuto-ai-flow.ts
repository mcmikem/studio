

'use server';

/**
 * @fileOverview The main conversational AI agent for Omuto Central.
 * This flow acts as an expert assistant, knowledgeable about all aspects
 * of the Omuto Foundation's operations.
 */

import { ai } from '@/ai/genkit';
import { KNOWLEDGE_BASE } from '@/lib/data';
import type { OmutoAIInput, OmutoAIOutput, SearchResultItem, AlertInput } from '@/lib/types';
import { SearchResultItemSchema, OmutoAIInputSchema, OmutoAIOutputSchema, AlertInputSchema } from '@/lib/types';
import { z } from 'zod';
import { getFirebaseAdmin } from '@/firebase/server';
import { collection, query, where, getDocs, doc, addDoc, getDoc, serverTimestamp, orderBy, limit, Timestamp } from 'firebase/firestore';
import { createAlert } from './create-alert-flow';
import { googleAI } from '@genkit-ai/google-genai';

export async function omutoAIFlow(input: OmutoAIInput): Promise<OmutoAIOutput> {
    console.log('Starting omutoAIFlow');

    try {
        const { firestore } = getFirebaseAdmin();

        // --- TOOL DEFINITIONS (MOVED INSIDE) ---

        const findUsersByNameToolObject = ai.defineTool(
            {
                name: 'findUsersByName',
                description: 'Finds staff members by their name.',
                inputSchema: z.object({ name: z.string().describe("The name of the staff member to search for.") }),
                outputSchema: z.array(SearchResultItemSchema),
            },
            async ({ name }) => {
                const usersRef = collection(firestore, 'users');
                const q = query(usersRef, where('name', '>=', name), where('name', '<=', name + '\uf8ff'));
                const snapshot = await getDocs(q);
                if (snapshot.empty) return [];
                return snapshot.docs.map(doc => ({ id: doc.id, type: 'User', title: doc.data().name, url: `/profile?userId=${doc.id}` }));
            }
        );

        const findProgramsByNameToolObject = ai.defineTool(
            {
                name: 'findProgramsByName',
                description: 'Finds programs by their title.',
                inputSchema: z.object({ title: z.string().describe("The title of the program to search for.") }),
                outputSchema: z.array(SearchResultItemSchema),
            },
            async ({ title }) => {
                const programsRef = collection(firestore, 'programs');
                const q = query(programsRef, where('title', '>=', title), where('title', '<=', title + '\uf8ff'));
                const snapshot = await getDocs(q);
                if (snapshot.empty) return [];
                return snapshot.docs.map(doc => ({ id: doc.id, type: 'Program', title: doc.data().title, url: `/management/programs` }));
            }
        );
        
        const findExpensesByTitleToolObject = ai.defineTool(
            {
                name: 'findExpensesByTitle',
                description: 'Finds expense reports by their title.',
                inputSchema: z.object({ title: z.string().describe("The title of the expense report to search for.") }),
                outputSchema: z.array(SearchResultItemSchema),
            },
            async ({ title }) => {
                const expensesRef = collection(firestore, 'expenses');
                const q = query(expensesRef, where('title', '>=', title), where('title', '<=', title + '\uf8ff'));
                const snapshot = await getDocs(q);
                if (snapshot.empty) return [];
                return snapshot.docs.map(doc => ({ id: doc.id, type: 'Expense', title: doc.data().title, url: `/management/expenses?highlight=${doc.id}` }));
            }
        );
        
        const searchOmutoToolObject = ai.defineTool(
            {
                name: 'searchOmuto',
                description: 'Performs a global search across users, programs, and expenses to find information within the Omuto Central app.',
                inputSchema: z.object({ query: z.string().describe("The user's natural language search query.") }),
                outputSchema: z.array(SearchResultItemSchema),
            },
            async ({ query }) => {
                console.log(`Searching Omuto for: ${query}`);
                const users = await findUsersByNameToolObject.fn({ name: query });
                const programs = await findProgramsByNameToolObject.fn({ title: query });
                const expenses = await findExpensesByTitleToolObject.fn({ title: query });

                const combined = [...users, ...programs, ...expenses];
                const uniqueResults = Array.from(new Map(combined.map(item => [item.id, item])).values());
                
                console.log(`Found ${uniqueResults.length} unique results.`);
                return uniqueResults;
            }
        );

        const createCheckoutToolObject = ai.defineTool(
            {
                name: 'createCheckout',
                description: 'Creates an end-of-day checkout report for a user.',
                inputSchema: z.object({
                    userId: z.string().describe("The ID of the user submitting the report."),
                    task: z.string().describe("The summary of what the user accomplished today."),
                    learning: z.string().optional().describe("The user's key learning or adaptation."),
                    tomorrowPlan: z.string().optional().describe("The user's top priority for tomorrow."),
                }),
                outputSchema: z.object({ success: z.boolean(), message: z.string() })
            },
            async ({ userId, task, learning, tomorrowPlan }) => {
                try {
                    const userRef = doc(firestore, 'users', userId);
                    const userSnap = await getDoc(userRef);

                    if (!userSnap.exists()) {
                        return { success: false, message: `Could not find user with ID ${userId}.`};
                    }
                    const userProfile = userSnap.data();

                    if (!userProfile) {
                        return { success: false, message: `Could not load user profile for ID ${userId}.`};
                    }

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
        
        const getRecentCheckinsToolObject = ai.defineTool(
            {
                name: 'getRecentCheckins',
                description: "Retrieves today's start-of-day check-in reports from the team.",
                inputSchema: z.object({ count: z.number().optional().default(10).describe('The number of recent check-ins to retrieve.') }),
                outputSchema: z.array(z.object({ name: z.string(), primaryMission: z.string() }))
            },
            async ({ count }) => {
                const checkinsRef = collection(firestore, 'checkins');
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const startOfToday = Timestamp.fromDate(today);

                const q = query(checkinsRef, where('timestamp', '>=', startOfToday), orderBy('timestamp', 'desc'), limit(count));
                const snapshot = await getDocs(q);
                if (snapshot.empty) return [];
                return snapshot.docs.map(doc => {
                    const data = doc.data();
                    return { name: data.name, primaryMission: data.primaryMission };
                });
            }
        );
        
        const getRecentCheckoutsToolObject = ai.defineTool(
            {
                name: 'getRecentCheckouts',
                description: 'Retrieves the most recent end-of-day checkout reports from the team.',
                inputSchema: z.object({ count: z.number().optional().default(5).describe('The number of recent checkouts to retrieve.') }),
                outputSchema: z.array(z.object({
                    name: z.string(),
                    tasks: z.array(z.object({ description: z.string(), status: z.string() })),
                    learning: z.string().optional(),
                    tomorrowPlan: z.string().optional(),
                }))
            },
            async ({ count }) => {
                const checkoutsRef = collection(firestore, 'checkouts');
                const q = query(checkoutsRef, orderBy('timestamp', 'desc'), limit(count));
                const snapshot = await getDocs(q);
                if (snapshot.empty) return [];
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

        // --- MAIN FLOW LOGIC ---

        const history = input.history || [];
        console.log(`omutoAIFlow invoked with question: "${input.question}"`);

        const { text, toolRequest } = await ai.generate({
            model: googleAI('gemini-1.5-flash-latest'),
            prompt: `You are Omuto AI, an expert assistant for the Omuto Foundation, a youth-led NGO in Uganda.
Your knowledge is not just static; you can learn about the team's current activities and data by using the tools provided.

## Knowledge Base
${KNOWLEDGE_BASE}

## Tool Usage Instructions & Dynamic Knowledge

- **searchOmuto**: If the user asks a question about a person, program, project, or expense, use this tool to find the information from the database. This is your primary way of accessing organizational knowledge.
- **createCheckout**: If the user asks to "check out", "submit my report", or a similar phrase, you MUST use this tool. Extract the 'task' (what they did today), 'learning' (what they learned), and 'tomorrowPlan' (what they will do tomorrow) from their message. The user ID is provided in the prompt. If any piece of information is missing, ask a clarifying question before using the tool. For example: "I can submit that for you. What was your key learning today?"
- **getRecentCheckins / getRecentCheckouts**: You have the ability to get real-time updates from the team. If the user asks what the team is doing, what they did yesterday, who has checked in, or for a summary of recent activity, use these tools to get the latest data and then summarize it for the user. This is how you "learn" about the team's current state.

---
UserId: ${input.userId}.

User's message: "${input.question}"`,
            history: history,
            tools: [
                searchOmutoToolObject, 
                createCheckoutToolObject, 
                getRecentCheckinsToolObject, 
                getRecentCheckoutsToolObject
            ],
            config: {
                temperature: 0.2,
            }
        });
        
        const answer = text;
        
        if (!answer) {
            console.error("AI did not return a text response, even after potential tool use.", { text, toolRequest });
            if (toolRequest) {
              return { answer: "I've processed your request using my tools, but I don't have a final text summary to provide. Let me know if you need anything else!" };
            }
            return { answer: "I'm sorry, but I wasn't able to generate a response. Please try again." };
        }
        
        console.log('omutoAIFlow completed successfully.');
        return { answer };

    } catch (error: any) {
        console.error("[omutoAIFlow] Critical error during AI generation:", error);
        return { answer: `I'm sorry, I encountered a server error and couldn't complete your request. Please try again.` };
    }
}
