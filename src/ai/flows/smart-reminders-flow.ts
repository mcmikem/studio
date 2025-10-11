
'use server';

/**
 * @fileOverview A flow to generate dynamic, context-aware reminders for a user.
 */

import { ai } from '@/ai/genkit';
import { getUpcomingEvents, getPendingTasks } from '../tools/omuto-tools';
import { SmartRemindersInputSchema, SmartRemindersOutputSchema, type SmartRemindersInput, type SmartRemindersOutput } from '@/lib/types';


const smartRemindersPrompt = ai.definePrompt(
  {
    name: 'smartRemindersPrompt',
    system: "You are a proactive, intelligent assistant for the Omuto Foundation. Your goal is to help team members stay on track by providing smart, actionable reminders based on their current context. Be concise and encouraging.",
    tools: [getUpcomingEvents, getPendingTasks],
    output: {
      schema: SmartRemindersOutputSchema,
    },
  }
);


export async function generateSmartReminders(input: SmartRemindersInput): Promise<SmartRemindersOutput> {
    const llmResponse = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        tools: [smartRemindersPrompt],
        prompt: `Generate a short list of 3-4 smart, actionable reminders for {{userName}} (Role: {{userRole}}). Use the available tools to get their upcoming events and pending tasks.

Analyze the data and provide specific, helpful nudges. For example:
- If a task is due soon, remind them of the deadline.
- If an important event is coming up, suggest a preparation step.
- Connect tasks to organizational goals if possible.
- Keep the tone friendly and supportive.

Current User ID is: {{userId}}`,
        input: {
            userId: input.userId,
            userName: input.userName,
            userRole: input.userRole,
        },
        config: {
            temperature: 0.5, // Be more creative with suggestions
        },
    });

    const output = llmResponse.output();
    if (!output) {
      throw new Error('AI failed to generate reminders.');
    }
    return output;
}
