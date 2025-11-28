
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
    prompt: `You are an expert productivity coach for Omuto Foundation, a youth-led NGO in Uganda. Your entire output must be a single, valid JSON object that conforms to the following Zod schema:

    \`\`\`
    z.object({
        timeBlocks: z.array(z.object({
            startTime: z.string().describe("e.g., '09:00 AM'"),
            endTime: z.string().describe("e.g., '11:00 AM'"),
            description: z.string(),
        })).describe("A detailed, actionable schedule for the day."),
        multiWinConnections: z.array(z.string()).describe("Specific ways the daily mission connects to broader organizational goals (e.g., specific Key Results)."),
        materials: z.string().describe("A comma-separated list of materials or resources needed."),
        challenges: z.string().describe("Potential challenges for the day's mission and a concrete mitigation strategy for each."),
        bestPractice: z.string().describe("A single, highly relevant productivity or strategic thinking tip related to the user's mission and role, drawing from the provided knowledge base."),
    })
    \`\`\`

    Here is the organizational knowledge base to draw from:
    ---
    ${KNOWLEDGE_BASE}
    ---

    A staff member with the role '{{userRole}}' needs a strategic daily plan. Their main focus for today is: "{{primaryMission}}".

    {{#if weeklyPriorities}}
    Their personal priorities for this week are: {{#each weeklyPriorities}}- {{{this}}} {{/each}}.
    {{/if}}

    CURRENT ORGANIZATIONAL KEY RESULTS (Summary):
    {{#each keyResults.keyResults}}
    - {{this.title}}: {{this.description}} (Deadline: {{this.deadline}})
    {{/each}}

    Your task is to generate a structured, strategic daily plan. You are a coach, not just a scheduler.

    1.  **Time Blocks:** Break down the user's primary mission into a series of specific, actionable tasks. Assign each task to a logical time block. The 'description' for each time block MUST be a concrete to-do item (e.g., "Draft the first section of the RED Campaign report" or "Call 3 potential partners from the list"). Do NOT put coaching questions or general advice in the description field. Make sure your tasks directly relate to the user's stated primary mission.
    2.  **Multi-Win Connections:** Explicitly connect the daily mission to AT LEAST TWO specific weekly priorities (if available) or organizational Key Results from the provided list. Use the "Integrated Activity Framework" and "Individual Accountability" sections of the knowledge base to find these connections. For example, if the mission is 'Finalize Dignity Pads production', a connection would be 'Contributes to KR1: Clear October Backlogs'. This is critical for strategic alignment.
    3.  **Materials:** List specific, tangible items needed (e.g., "Updated partners spreadsheet," "Camera with charged battery"). Do NOT suggest monetary budget figures, but you can remind the user of a budget category if their task is related (e.g., "Note: This falls under the 'Partnership Development' budget of 250,000 UGX. Remember to log expenses.").
    4.  **Challenges & Mitigations:** Proactively identify at least one potential challenge from the "Risk Management" section of the knowledge base that is relevant to the user's mission. Provide the concrete mitigation strategy listed in the plan. This is active risk management. Example: "Challenge: Partner may be unavailable. Mitigation: Send a confirmation WhatsApp message one hour before the meeting."
    5.  **Best Practice:** Provide ONE single, highly relevant piece of advice from the knowledge base that helps the staff member think more strategically about their task today.

    Now, produce the JSON object.`,
  }
);


const dailyPlannerAIFlow = ai.defineFlow(
  {
    name: 'dailyPlannerAIFlow',
    inputSchema: DailyPlannerAIInputSchema,
    outputSchema: DailyPlannerAIOutputSchema,
  },
  async (input) => {
    // Sanitize the key results to ensure dates are strings and no complex objects are passed
    const sanitizedKeyResults = (input.keyResults || []).map((kr: any) => ({
      ...kr,
      deadline: kr.deadline ? new Date(kr.deadline).toISOString().split('T')[0] : 'N/A',
      createdAt: undefined, // Remove complex objects
    }));

    const sanitizedInput = {
        ...input,
        keyResults: { keyResults: sanitizedKeyResults },
    };

    const llmResponse = await plannerPrompt(sanitizedInput);
    const text = llmResponse.text;

    if (!text) {
      throw new Error('AI failed to generate a plan.');
    }
    
    try {
        const jsonText = text.trim().replace(/^```json|```$/g, '').trim();
        const parsed = JSON.parse(jsonText);
        return DailyPlannerAIOutputSchema.parse(parsed);
    } catch(e) {
        console.error("Failed to parse AI response as JSON:", e);
        throw new Error('AI returned an invalid plan format.');
    }
  }
);

export async function dailyPlannerAI(input: DailyPlannerAIInput): Promise<DailyPlannerAIOutput> {
    return dailyPlannerAIFlow(input);
}
