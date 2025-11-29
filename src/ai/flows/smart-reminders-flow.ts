
'use server';

/**
 * @fileOverview A flow to generate dynamic, context-aware reminders for a user.
 */
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import type { SmartRemindersOutput, SmartRemindersInput } from '@/lib/types';
import { SmartRemindersInputSchema, SmartRemindersOutputSchema } from '@/lib/types';
import { getFirebaseAdmin } from '@/firebase/server';
import { collection, query, where, orderBy, getDocs, Timestamp, limit } from 'firebase/firestore';
import { format } from 'date-fns';
import { z } from 'zod';

export async function generateSmartReminders(input: SmartRemindersInput): Promise<SmartRemindersOutput> {
    console.log('Starting generateSmartReminders flow');
    
    const ai = genkit({
        plugins: [googleAI()],
    });
    console.log('AI instance created for smart reminders');

    const getUpcomingEventsForUserToolObject = ai.defineTool(
        {
            name: 'getUpcomingEventsForUser',
            description: 'Retrieves the upcoming events for a specific user for the next 7 days.',
            inputSchema: z.object({ userId: z.string().describe('The ID of the user.') }),
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

    const getPendingTasksForUserToolObject = ai.defineTool(
        {
            name: 'getPendingTasksForUser',
            description: 'Retrieves the top 5 pending tasks for a specific user.',
            inputSchema: z.object({ userId: z.string().describe('The ID of the user.') }),
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

    const smartRemindersPrompt = ai.definePrompt(
        {
          name: 'smartRemindersPrompt',
          tools: [getUpcomingEventsForUserToolObject, getPendingTasksForUserToolObject],
          output: { schema: SmartRemindersOutputSchema },
          model: 'googleai/gemini-1.5-pro-latest',
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

    const llmResponse = await smartRemindersPrompt(input);
    const output = llmResponse.output();
    
    if (!output) {
      throw new Error('AI failed to generate reminders.');
    }
    
    console.log('generateSmartReminders flow completed successfully.');
    return output;
}
