
'use server';

/**
 * @fileOverview A flow to generate dynamic, context-aware reminders for a user.
 */

import { ai } from '@/ai/genkit';
import { SmartRemindersOutputSchema, SmartRemindersInputSchema, type SmartRemindersOutput, type SmartRemindersInput } from '@/lib/types';
import { KNOWLEDGE_BASE } from '@/lib/data';
import { getUpcomingEventsForUserTool, getPendingTasksForUserTool } from '../tools/omuto-tools';

export async function generateSmartReminders(input: SmartRemindersInput): Promise<SmartRemindersOutput> {
    
    const smartRemindersPrompt = ai.definePrompt(
      {
        name: 'smartRemindersPrompt',
        tools: [await getUpcomingEventsForUserTool(), await getPendingTasksForUserTool()],
        output: { schema: SmartRemindersOutputSchema },
        model: 'googleai/gemini-pro',
        prompt: `You are a proactive, intelligent assistant and performance coach for the Omuto Foundation, a youth-led NGO in Uganda. Your goal is to help team members stay on track by providing smart, actionable reminders based on their current context. Your output must be a JSON object conforming to the schema.

        Your reminders should be:
        - **Concise & Actionable**: Direct and to the point.
        - **Context-Aware**: Directly reference the user's tasks, events, and role.
        - **Strategically Aligned**: Connect daily tasks to broader Omuto goals (like Key Results from the October Plan) and the "Multiple Wins" framework.
        - **Encouraging & Supportive**: Sound like a helpful teammate, not a corporate robot.
        
        Analyze the user's upcoming events and pending tasks from the provided tool outputs. Provide a specific, helpful list of 3-4 smart, actionable reminders.

        Now, generate the reminders for ${input.userName} (Role: ${input.userRole}). Use the getUpcomingEventsForUser and getPendingTasksForUser tools with userId '${input.userId}' to get the necessary data.`,
      }
    );

    const llmResponse = await smartRemindersPrompt();
    const output = llmResponse.output();
    
    if (!output) {
      throw new Error('AI failed to generate reminders.');
    }
    
    return output;
}
