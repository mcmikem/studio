
'use server';

/**
 * @fileOverview A flow to generate dynamic, context-aware reminders for a user.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getUpcomingEvents, getPendingTasks } from '../tools/omuto-tools';

export const SmartRemindersInputSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  userRole: z.string(),
});
export type SmartRemindersInput = z.infer<typeof SmartRemindersInputSchema>;

export const SmartRemindersOutputSchema = z.object({
  reminders: z.array(z.string()).describe('A list of 3-4 concise, actionable, and personalized reminders.'),
});
export type SmartRemindersOutput = z.infer<typeof SmartRemindersOutputSchema>;


const smartRemindersPrompt = ai.definePrompt(
  {
    name: 'smartRemindersPrompt',
    system: "You are a proactive, intelligent assistant for the Omuto Foundation. Your goal is to help team members stay on track by providing smart, actionable reminders based on their current context. Be concise and encouraging.",
    tools: [getUpcomingEvents, getPendingTasks],
    output: {
      schema: SmartRemindersOutputSchema,
    },
    prompt: `Generate a short list of 3-4 smart, actionable reminders for {{userName}} (Role: {{userRole}}). Use the available tools to get their upcoming events and pending tasks.

    Analyze the data and provide specific, helpful nudges. For example:
    - If a task is due soon, remind them of the deadline.
    - If an important event is coming up, suggest a preparation step.
    - Connect tasks to organizational goals if possible.
    - Keep the tone friendly and supportive.
    
    Current User ID is: {{userId}}`,
  }
);


export const generateSmartReminders = ai.defineFlow(
  {
    name: 'generateSmartRemindersFlow',
    inputSchema: SmartRemindersInputSchema,
    outputSchema: SmartRemindersOutputSchema,
  },
  async (input) => {
    const llmResponse = await ai.generate({
      prompt: {
        ...smartRemindersPrompt,
        input: { userId: input.userId, userName: input.userName, userRole: input.userRole },
      },
      model: 'googleai/gemini-2.5-flash',
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
);
