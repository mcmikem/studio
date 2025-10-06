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
  task: z.string().describe('The primary task or goal for the day.'),
  role: z.string().describe('The role of the user, to tailor the advice (e.g., "Programs & Partnerships Manager").'),
});
export type DailyPlannerAIInput = z.infer<typeof DailyPlannerAIInputSchema>;

const DailyPlannerAIOutputSchema = z.object({
  timeBlocks: z.array(TimeBlockSchema).describe("A suggested schedule of 2-4 time blocks for the user's day."),
  multiWinConnections: z.array(z.string()).describe("A list of 2-3 relevant 'multi-win' opportunities the user should look for."),
  budget: z.number().optional().describe("A suggested budget in UGX if applicable, e.g., 50000."),
  materials: z.string().optional().describe("A brief list of materials the user might need."),
  challenges: z.string().optional().describe("A brief description of 1-2 potential challenges the user might face."),
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

A team member with the role '{{{role}}}' is focusing on the following task today:
"{{{task}}}"

Based on this task, their role, and the context of a Ugandan non-profit, generate a complete, actionable first draft of their daily plan.

Your output MUST be a JSON object that includes:
1.  **timeBlocks**: Create a logical schedule with 2-4 time blocks. Include realistic travel time if the task suggests field work.
2.  **multiWinConnections**: Suggest 2-3 high-impact "multi-win" opportunities from the following list: 'Recruit a volunteer', 'Capture content (photos/video)', 'Gather a testimonial or story', 'Identify a potential new partner', 'Improve a process/template'.
3.  **budget**: Suggest a reasonable budget in UGX if the activity implies costs (like transport or materials).
4.  **materials**: Suggest specific materials needed.
5.  **challenges**: Identify 1-2 potential challenges to watch out for.

Think like a seasoned manager guiding a team member to be as effective as possible. The plan should be practical and strategic.
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
