
'use server';

/**
 * @fileOverview A flow to generate dynamic, context-aware reminders for a user.
 */

import { ai } from '@/ai/genkit';
import { SmartRemindersOutputSchema, SmartRemindersInputSchema, type SmartRemindersOutput, type SmartRemindersInput } from '@/lib/types';
import { KNOWLEDGE_BASE } from '@/lib/data';


const smartRemindersPrompt = ai.definePrompt(
  {
    name: 'smartRemindersPrompt',
    input: { schema: SmartRemindersInputSchema },
    output: { schema: SmartRemindersOutputSchema },
    system: `You are a proactive, intelligent assistant and performance coach for the Omuto Foundation, a youth-led NGO in Uganda. Your goal is to help team members stay on track by providing smart, actionable reminders based on their current context.

Your reminders should be:
- **Concise & Actionable**: Direct and to the point.
- **Context-Aware**: Directly reference the user's tasks, events, and role.
- **Strategically Aligned**: Connect daily tasks to broader Omuto goals (like Key Results from the October Plan) and the "Multiple Wins" framework.
- **Encouraging & Supportive**: Sound like a helpful teammate, not a corporate robot.`,
    prompt: `Generate a short list of 3-4 smart, actionable reminders for {{userName}} (Role: {{userRole}}).

Analyze their upcoming events and pending tasks. Provide specific, helpful nudges that connect to Omuto's work.

**Here are good examples of the tone and specificity required:**
- "Your report for the RED Campaign is due Friday. Does this connect to our fundraising goal (OCT-KR1)? Maybe mention the number of girls impacted."
- "As you prepare for the field visit, remember our 'Multiple Wins' goal. Could you also capture a short video for Omuto Pulse?"
- "Since your calendar is clear, it's a great chance to make progress on standardizing the YAP Chapter SOPs (OCT-KR6)."

**User's Upcoming Events (next 7 days):**
{{#each upcomingEvents}}
- {{this.title}} on {{this.date}}
{{/each}}
{{#unless upcomingEvents}}
No upcoming events.
{{/unless}}

**User's Pending Tasks:**
{{#each pendingTasks}}
- {{this.title}} (Due: {{this.dueDate}})
{{/each}}
{{#unless pendingTasks}}
No pending tasks.
{{/unless}}
`
  }
);


export async function generateSmartReminders(input: SmartRemindersInput): Promise<SmartRemindersOutput> {
    const llmResponse = await smartRemindersPrompt(input);
    
    const { output } = llmResponse;
    if (!output) {
      throw new Error('AI failed to generate reminders.');
    }
    return output;
}
