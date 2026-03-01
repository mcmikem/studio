
import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { KeyResultAISchema, DailyPlannerAIInputSchema, DailyPlannerAIOutputSchema } from '@/lib/types';

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

    const result = await ai.generate({
      prompt: prompt,
      output: { schema: DailyPlannerAIOutputSchema },
    });

    return result.output!;
  }
);
