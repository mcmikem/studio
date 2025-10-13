
'use server';

/**
 * @fileOverview A flow to generate dynamic, context-aware reminders for a user.
 */

import { ai } from '@/ai/genkit';
import { SmartRemindersOutputSchema, SmartRemindersInputSchema, type SmartRemindersOutput, type SmartRemindersInput } from '@/lib/types';


const smartRemindersPrompt = ai.definePrompt(
  {
    name: 'smartRemindersPrompt',
    input: { schema: SmartRemindersInputSchema },
    output: { schema: SmartRemindersOutputSchema },
    system: "You are a proactive, intelligent assistant for the Omuto Foundation. Your goal is to help team members stay on track by providing smart, actionable reminders based on their current context. Be concise and encouraging.",
    prompt: `Generate a short list of 3-4 smart, actionable reminders for {{userName}} (Role: {{userRole}}).

Analyze their upcoming events and pending tasks and provide specific, helpful nudges. For example:
- If a task is due soon, remind them of the deadline.
- If an important event is coming up, suggest a preparation step.
- Connect tasks to organizational goals if possible.
- Keep the tone friendly and supportive.

Upcoming Events:
{{#each upcomingEvents}}
- {{this.title}} on {{this.date}}
{{/each}}
{{#if (upcomingEvents.length === 0)}}
No upcoming events in the next 7 days.
{{/if}}

Pending Tasks:
{{#each pendingTasks}}
- {{this.title}} (Due: {{this.dueDate || 'No due date'}})
{{/each}}
{{#if (pendingTasks.length === 0)}}
No pending tasks.
{{/if}}
`
  }
);


export async function generateSmartReminders(input: SmartRemindersInput): Promise<SmartRemindersOutput> {
    const llmResponse = await smartRemindersPrompt(input);
    
    const output = llmResponse.output();
    if (!output) {
      throw new Error('AI failed to generate reminders.');
    }
    return output;
}
