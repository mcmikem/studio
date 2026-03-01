
import { z } from 'zod';
import { ai } from '@/ai/genkit';

export const StrategicAdvisorInputSchema = z.object({
  activities: z.array(z.any()).describe('Array of activity objects from the last 30 days.'),
  checkins: z.array(z.any()).describe('Array of check-in objects from today.'),
  expenses: z.array(z.any()).describe('Array of expense objects from the last 30 days.'),
  keyResults: z.array(z.any()).describe('Array of the current operational plan\'s key results.'),
});
export type StrategicAdvisorInput = z.infer<typeof StrategicAdvisorInputSchema>;


export const StrategicAdvisorOutputSchema = z.object({
  insights: z.array(z.object({
    emoji: z.string().describe('An emoji representing the insight (e.g., "📈", "⚠️", "💡").'),
    title: z.string().describe('A very short, catchy title for the insight.'),
    description: z.string().describe('A concise, one-sentence description of the key finding.'),
    recommendation: z.string().describe('A single, actionable recommendation for the leader.'),
  })).describe('A list of 3-4 high-level strategic insights.'),
});
export type StrategicAdvisorOutput = z.infer<typeof StrategicAdvisorOutputSchema>;

export const strategicAdvisorFlow = ai.defineFlow(
  {
    name: 'strategicAdvisorFlow',
    inputSchema: StrategicAdvisorInputSchema,
    outputSchema: StrategicAdvisorOutputSchema,
  },
  async ({ activities, checkins, expenses, keyResults }) => {
    const prompt = `
      You are an AI Strategic Advisor for the Omuto Foundation, a youth-led NGO in rural Uganda. Your user is the Executive Director.
      Your task is to analyze the provided JSON data from the last 30 days and generate 3-4 high-level, actionable insights.
      Do not state the obvious. Find trends, risks, and opportunities. Be direct and concise.

      Here is the raw data:
      - Key Results (Our current strategy): ${JSON.stringify(keyResults)}
      - Activities (What the team has done): ${JSON.stringify(activities)}
      - Check-ins (Today's team focus): ${JSON.stringify(checkins)}
      - Expenses (Where money is going): ${JSON.stringify(expenses)}

      Analyze the data to find critical insights. Here are some examples of what to look for:
      1.  **Momentum Shift**: Is there a sudden drop or increase in activity for a key program (e.g., 'RED Campaign')? Compare the last 7 days to the previous 23.
      2.  **Budget Anomalies**: Is the expense burn rate for a specific category (e.g., 'Transport') unusually high compared to the number of activities logged?
      3.  **Strategic Misalignment**: Are team members' daily check-in missions consistently focused on activities that do not align with any of the current Key Results?
      4.  **Emerging Blockers**: Do you see recurring keywords like "challenge," "stuck," "transport," or "delay" in activity or checkout reports that might indicate a systemic issue?
      5.  **Untapped Opportunity**: Is one program generating a very high ROI compared to others? Is a specific team member outperforming everyone else?

      Based on your analysis, provide 3-4 insights in the required JSON format. Each insight must be impactful and provide a clear recommendation.
      
      Example Insight:
      {
        "emoji": "⚠️",
        "title": "RED Campaign Slowdown",
        "description": "Activity for the RED Campaign has dropped 50% in the last week, despite it being a high priority KR.",
        "recommendation": "Check in with the program lead to identify and resolve potential blockers."
      }
    `;

    const result = await ai.generate({
      prompt: prompt,
      output: { schema: StrategicAdvisorOutputSchema },
    });

    return result.output!;
  }
);
