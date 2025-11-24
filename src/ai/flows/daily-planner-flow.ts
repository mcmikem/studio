
'use server';

/**
 * @fileOverview The AI-powered daily planner flow.
 * This flow takes a user's primary mission, their role, and organizational context
 * to generate a structured, strategic daily plan.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { DailyPlannerAIInput, DailyPlannerAIOutput } from '@/lib/types';
import { DailyPlannerAIInputSchema, DailyPlannerAIOutputSchema } from '@/lib/types';
import { KNOWLEDGE_BASE } from '@/lib/data';

const plannerPrompt = ai.definePrompt(
  {
    name: 'dailyPlannerPrompt',
    input: { schema: DailyPlannerAIInputSchema },
    output: { schema: DailyPlannerAIOutputSchema },
    system: KNOWLEDGE_BASE, // Embed the entire organizational DNA
    prompt: `You are an expert productivity coach for Omuto Foundation. A staff member with the role '{{userRole}}' needs a strategic daily plan. Their main focus for today is: "{{primaryMission}}".

    {{#if weeklyPriorities}}
    Their personal priorities for this week are: {{#each weeklyPriorities}}- {{{this}}} {{/each}}.
    {{/if}}

    CURRENT ORGANIZATIONAL KEY RESULTS (Summary):
    {{#each keyResults}}
    - {{this.title}}: {{this.description}} (Deadline: {{this.deadline}})
    {{/each}}

    Your task is to generate a structured, strategic daily plan. You are a coach, not just a scheduler.

    1.  **Time Blocks:** Break down the user's primary mission into a series of specific, actionable tasks. Assign each task to a logical time block. The 'description' for each time block MUST be a concrete to-do item (e.g., "Draft the first section of the RED Campaign report" or "Call 3 potential partners from the list"). Do NOT put coaching questions or general advice in the description field. Make sure your tasks directly relate to the user's stated primary mission.
    2.  **Multi-Win Connections:** Explicitly connect the daily mission to AT LEAST TWO specific weekly priorities (if available) or organizational Key Results from the provided list. Use the "Integrated Activity Framework" and "Individual Accountability" sections of the knowledge base to find these connections. For example, if the mission is 'Finalize Dignity Pads production', a connection would be 'Contributes to KR1: Clear October Backlogs'. This is critical for strategic alignment.
    3.  **Materials:** List specific, tangible items needed (e.g., "Updated partners spreadsheet," "Camera with charged battery"). Do NOT suggest monetary budget figures, but you can remind the user of a budget category if their task is related (e.g., "Note: This falls under the 'Partnership Development' budget of 250,000 UGX. Remember to log expenses.").
    4.  **Challenges & Mitigations:** Proactively identify at least one potential challenge from the "Risk Management" section of the knowledge base that is relevant to the user's mission. Provide the concrete mitigation strategy listed in the plan. This is active risk management. Example: "Challenge: Partner may be unavailable. Mitigation: Send a confirmation WhatsApp message one hour before the meeting."
    5.  **Best Practice:** Provide ONE single, highly relevant piece of advice from the knowledge base that helps the staff member think more strategically about their task today.

    Produce the output in the required JSON format.`,
  }
);


const dailyPlannerAIFlow = ai.defineFlow(
  {
    name: 'dailyPlannerAIFlow',
    inputSchema: DailyPlannerAIInputSchema,
    outputSchema: DailyPlannerAIOutputSchema,
  },
  async (input) => {
    const { output } = await plannerPrompt(input);
    if (!output) {
      throw new Error('AI failed to generate a plan.');
    }
    return output;
  }
);

export async function dailyPlannerAI(input: DailyPlannerAIInput): Promise<DailyPlannerAIOutput> {
    return dailyPlannerAIFlow(input);
}
