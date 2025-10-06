'use server';

/**
 * @fileOverview An AI assistant for daily planning.
 *
 * - dailyPlannerAI - A function that provides brainstorming and guidance for a given task.
 * - DailyPlannerAIInput - The input type for the dailyPlannerAI function.
 * - DailyPlannerAIOutput - The return type for the dailyPlannerAI function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DailyPlannerAIInputSchema = z.object({
  task: z.string().describe('The primary task or goal for the day.'),
  role: z.string().describe('The role of the user, to tailor the advice (e.g., "Programs & Partnerships Manager").'),
});
export type DailyPlannerAIInput = z.infer<typeof DailyPlannerAIInputSchema>;

const DailyPlannerAIOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('A list of 3-4 actionable suggestions, best practices, or brainstorming ideas related to the task.'),
});
export type DailyPlannerAIOutput = z.infer<typeof DailyPlannerAIOutputSchema>;

export async function dailyPlannerAI(input: DailyPlannerAIInput): Promise<DailyPlannerAIOutput> {
  return dailyPlannerAIFlow(input);
}

const prompt = ai.definePrompt({
  name: 'dailyPlannerPrompt',
  input: {schema: DailyPlannerAIInputSchema},
  output: {schema: DailyPlannerAIOutputSchema},
  prompt: `You are an expert productivity coach for a youth-focused non-profit in Uganda called Omuto Foundation. Your role is to help team members plan their day effectively.

A team member with the role '{{{role}}}' is focusing on the following task today:
"{{{task}}}"

Based on this task and their role, provide a short list of 3-4 actionable suggestions, best practices, or brainstorming questions to help them maximize their impact. Frame your suggestions within the context of a non-profit working with youth in Uganda. Think about potential multi-win connections, resource optimization, and stakeholder engagement.
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
