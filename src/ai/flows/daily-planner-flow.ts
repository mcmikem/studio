'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { KeyResultAISchema } from '@/lib/types';


export const DailyPlannerAIInputSchema = z.object({
  userName: z.string().describe("The name of the user."),
  userRole: z.string().describe('The role of the staff member (e.g., "Programs & Partnerships Manager").'),
  primaryMission: z.string().describe("The user's stated main focus for the day."),
  weeklyPriorities: z.array(z.string()).describe("The user's key priorities for the current week. This may be an empty array if no weekly plan is set."),
  keyResults: z.array(KeyResultAISchema).describe("A list of the organization's current Key Results (OKRs)."),
});
export type DailyPlannerAIInput = z.infer<typeof DailyPlannerAIInputSchema>;

export const DailyPlannerAIOutputSchema = z.object({
    timeBlocks: z.array(z.object({
        startTime: z.string().describe("e.g., '09:00 AM'"),
        endTime: z.string().describe("e.g., '11:00 AM'"),
        description: z.string(),
    })).describe("A detailed, actionable schedule for the day, broken into logical time blocks."),
    strategicAlignments: z.array(z.object({
        krTitle: z.string().describe("The title of the Key Result this mission aligns with."),
        alignmentJustification: z.string().describe("A brief, one-sentence explanation of *how* the daily mission supports this specific Key Result."),
    })).describe("A list of 1-2 key results that this daily mission directly supports."),
    materials: z.string().describe("A comma-separated list of what they will need."),
    challenges: z.string().describe("Potential challenges for the day's mission and a concrete mitigation strategy for each."),
    bestPractice: z.string().describe("A single, highly relevant productivity or strategic thinking tip related to the user's mission and role, drawing from a knowledge base of best practices for NGO work."),
});
export type DailyPlannerAIOutput = z.infer<typeof DailyPlannerAIOutputSchema>;

export const dailyPlannerFlow = ai.defineFlow(
  {
    name: 'dailyPlannerFlow',
    inputSchema: DailyPlannerAIInputSchema,
    outputSchema: DailyPlannerAIOutputSchema,
  },
  async ({ userName, userRole, primaryMission, weeklyPriorities, keyResults }) => {
    const prompt = `
      You are an elite performance coach for a youth-led NGO in rural Uganda called Omuto Foundation.
      Your client is ${userName}, a ${userRole}.
      Their primary mission for today is: "${primaryMission}".

      Here is the strategic context:
      - Their Personal Weekly Priorities: ${JSON.stringify(weeklyPriorities)}
      - The Organization's Current Key Results (OKRs): ${JSON.stringify(keyResults)}

      Your task is to generate a comprehensive, actionable daily plan in JSON format. The plan must include:
      1.  **Time Blocks**: A logical, step-by-step schedule for the day. Be specific and action-oriented.
      2.  **Strategic Alignments**: Identify 1-2 of the most relevant Organizational Key Results that this mission supports. For each, provide a brief justification explaining the connection. This is the most important section to help the user feel connected to the bigger picture.
      3.  **Materials**: A simple comma-separated list of what they will need.
      4.  **Challenges**: Anticipate potential obstacles and provide concrete mitigation strategies.
      5.  **Best Practice**: Offer a single, powerful productivity tip relevant to their role and mission.

      Generate the full JSON output based on this analysis. Ensure the strategic alignment is clear and motivational.
    `;

    const llmResponse = await ai.generate({
      prompt: prompt,
      model: 'googleai/gemini-pro',
      output: { schema: DailyPlannerAIOutputSchema },
      config: { temperature: 0.3 }
    });

    return llmResponse.output!;
  }
);
