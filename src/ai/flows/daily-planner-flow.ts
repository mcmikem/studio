'use server';

/**
 * @fileOverview An AI assistant for daily planning that generates a complete first draft.
 *
 * - dailyPlannerAI - A function that provides a full plan draft for a given task.
 * - DailyPlannerAIInput - The input type for the dailyPlannerAI function.
 * - DailyPlannerAIOutput - The return type for the dailyPlannerAI function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TimeBlockSchema = z.object({
  startTime: z.string().describe("The start time of the block in HH:mm format, e.g., '09:00'."),
  endTime: z.string().describe("The end time of the block in HH:mm format, e.g., '11:00'."),
  description: z.string().describe("A brief description of the task for this time block."),
});

const DailyPlannerAIInputSchema = z.object({
  task: z.string().describe('The primary task or goal for the day, often a Key Result.'),
  role: z.string().describe('The role of the user, to tailor the advice (e.g., "Programs & Partnerships Manager").'),
  userContext: z.string().optional().describe("The user's own description of what they plan to do."),
  weeklyPriorities: z.array(z.string()).optional().describe("The user's stated priorities for the entire week."),
  keyResults: z.any().optional().describe("A JSON object of the organization's current Key Results to provide strategic context."),
});
export type DailyPlannerAIInput = z.infer<typeof DailyPlannerAIInputSchema>;

const DailyPlannerAIOutputSchema = z.object({
  timeBlocks: z.array(TimeBlockSchema).describe("A suggested schedule of 2-4 time blocks for the user's day."),
  multiWinConnections: z.array(z.string()).describe("A list of 2-3 relevant 'multi-win' opportunities the user should look for."),
  materials: z.string().optional().describe("A brief list of materials or resources the user might need for their plan (e.g., 'Transport for 2, 50 printed handouts'). Do not suggest monetary values."),
  challenges: z.string().optional().describe("A brief description of 1-2 potential challenges the user might face, WITH a suggested mitigation for each."),
  bestPractice: z.string().optional().describe("A single, highly relevant best practice or piece of advice for the user's task, connecting it to the larger organizational goals."),
});
export type DailyPlannerAIOutput = z.infer<typeof DailyPlannerAIOutputSchema>;


export async function dailyPlannerAI(input: DailyPlannerAIInput): Promise<DailyPlannerAIOutput> {
  return dailyPlannerAIFlow(input);
}

const prompt = ai.definePrompt({
  name: 'dailyPlannerPrompt',
  input: {schema: DailyPlannerAIInputSchema},
  output: {schema: DailyPlannerAIOutputSchema},
  prompt: `You are an expert productivity coach and operations manager for a youth-focused non-profit in Uganda called Omuto Foundation. Your role is to help a team member create a comprehensive, strategic, and realistic daily plan.

A team member with the role '{{{role}}}' is planning their day.

Their primary mission for today is:
"{{{task}}}"

Their stated priorities for the entire week are:
{{#each weeklyPriorities}}
- {{{this}}}
{{/each}}

The user has provided this additional context for their plan:
"{{{userContext}}}"

To inform your coaching, here are the organization's current strategic Key Results for the month:
{{{json keyResults}}}

Based on ALL this information, act as a coach. Your goal is to help the user think more strategically. Generate a set of suggestions as a first draft for their daily plan. The plan must be practical, strategic, and reflect operational realities in Uganda. Critically, your suggestions must be reasoned and connect to the provided context.

Your output MUST be a JSON object that includes:
1.  **timeBlocks**: Create a logical schedule with 2-4 time blocks. If the context suggests field work, include realistic travel time. The tasks in the blocks should directly contribute to the stated mission.
2.  **multiWinConnections**: Suggest 2-3 high-impact "multi-win" opportunities from the following list that are most relevant to today's mission: 'Recruit a volunteer', 'Capture content (photos/video)', 'Gather a testimonial or story', 'Identify a potential new partner', 'Improve a process/template'.
3.  **materials**: Suggest specific, practical materials or resources needed for the mission (e.g., "Transport for 2 people, flipcharts, markers"). **IMPORTANT: Do NOT suggest monetary values or budget figures.** This is the user's responsibility.
4.  **challenges**: Identify 1-2 potential challenges (e.g., "transport delays") and, most importantly, propose a concrete mitigation strategy for each (e.g., "Mitigation: Call the boda boda driver 30 minutes before departure to confirm."). This is for risk management.
5.  **bestPractice**: Provide one single, highly relevant piece of professional advice. This tip should connect their specific daily task to a larger organizational Key Result, explaining WHY their task is important for the bigger picture.

Think like a seasoned manager guiding a team member to be as effective and strategic as possible. Your goal is not just to fill a form, but to teach them how to plan effectively by providing thoughtful suggestions.
`,
});

const dailyPlannerAIFlow = ai.defineFlow(
  {
    name: 'dailyPlannerAIFlow',
    inputSchema: DailyPlannerAIInputSchema,
    outputSchema: DailyPlannerAIOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
