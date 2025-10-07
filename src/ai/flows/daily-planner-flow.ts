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
});
export type DailyPlannerAIInput = z.infer<typeof DailyPlannerAIInputSchema>;

const DailyPlannerAIOutputSchema = z.object({
  timeBlocks: z.array(TimeBlockSchema).describe("A suggested schedule of 2-4 time blocks for the user's day."),
  multiWinConnections: z.array(z.string()).describe("A list of 2-3 relevant 'multi-win' opportunities the user should look for."),
  budget: z.number().optional().describe("A suggested budget in UGX if applicable, e.g., 50000."),
  materials: z.string().optional().describe("A brief list of materials the user might need."),
  challenges: z.string().optional().describe("A brief description of 1-2 potential challenges the user might face."),
  bestPractice: z.string().optional().describe("A single, highly relevant best practice or piece of advice for the user's task."),
});
export type DailyPlannerAIOutput = z.infer<typeof DailyPlannerAIOutputSchema>;


export async function dailyPlannerAI(input: DailyPlannerAIInput): Promise<DailyPlannerAIOutput> {
  return dailyPlannerAIFlow(input);
}

const prompt = ai.definePrompt({
  name: 'dailyPlannerPrompt',
  input: {schema: DailyPlannerAIInputSchema},
  output: {schema: DailyPlannerAIOutputSchema},
  prompt: `You are an expert productivity coach and operations manager for a youth-focused non-profit in Uganda called Omuto Foundation. Your role is to help team members create a comprehensive and strategic daily plan.

A team member with the role '{{{role}}}' is focusing on the following strategic task today:
"{{{task}}}"

They have provided this specific context for their plan:
"{{{userContext}}}"

Based on ALL this information, generate a complete, actionable first draft of their daily plan. The plan should be practical, strategic, and reflect operational realities in Uganda.

Your output MUST be a JSON object that includes:
1.  **timeBlocks**: Create a logical schedule with 2-4 time blocks. Include realistic travel time if the context suggests field work.
2.  **multiWinConnections**: Suggest 2-3 high-impact "multi-win" opportunities from the following list: 'Recruit a volunteer', 'Capture content (photos/video)', 'Gather a testimonial or story', 'Identify a potential new partner', 'Improve a process/template'.
3.  **budget**: Suggest a reasonable budget in UGX if the activity implies costs (like transport or materials).
4.  **materials**: Suggest specific materials needed.
5.  **challenges**: Identify 1-2 potential challenges to watch out for.
6.  **bestPractice**: Provide one single, highly relevant piece of professional advice or a best practice tip related to their specific context.

Think like a seasoned manager guiding a team member to be as effective as possible.
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
