
'use server';

import { z } from 'zod';
import { ai } from '@/ai/genkit';

const StrategicAdvisorOutputSchema = z.object({
  insights: z.array(z.object({
    emoji: z.string(),
    title: z.string(),
    description: z.string(),
    recommendation: z.string()
  }))
});

export const strategicAdvisorFlow = ai.defineFlow(
  {
    name: 'strategicAdvisorFlow',
    inputSchema: z.any(),
    outputSchema: StrategicAdvisorOutputSchema,
  },
  async ({ activities = [], checkins = [], expenses = [], keyResults = [] }) => {
    console.log('[StrategicAdvisor] Starting analysis with', { 
      activities: activities.length, 
      checkins: checkins.length, 
      expenses: expenses.length, 
      keyResults: keyResults.length 
    });

    const prompt = `
You are an AI Strategic Advisor for the Omuto Foundation, a youth-led NGO in rural Uganda. Your user is the Executive Director.
Your task is to analyze the provided JSON data from the last 30 days and generate 3-4 high-level, actionable insights.
Do not state the obvious. Find trends, risks, and opportunities. Be direct and concise.

Here is the raw data:
- Key Results (Our current strategy): ${JSON.stringify(keyResults).substring(0, 1000)}
- Activities (What the team has done): ${JSON.stringify(activities).substring(0, 1000)}
- Check-ins (Today's team focus): ${JSON.stringify(checkins).substring(0, 1000)}
- Expenses (Where money is going): ${JSON.stringify(expenses).substring(0, 1000)}

Analyze the data to find critical insights. Provide 3-4 insights in the required JSON format.
      
Example Insight:
{
  "emoji": "⚠️",
  "title": "RED Campaign Slowdown",
  "description": "Activity for the RED Campaign has dropped 50% in the last week, despite it being a high priority KR.",
  "recommendation": "Check in with the program lead to identify and resolve potential blockers."
}

Return ONLY valid JSON, no other text.
`;

    try {
      const result = await ai.generate({
        model: 'googleai/gemini-2.0-flash',
        prompt: prompt,
      });
      
      const text = result.text;
      console.log('[StrategicAdvisor] Raw response:', text?.substring(0, 200));
      
      // Try to parse JSON from response
      const jsonMatch = text?.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return parsed;
        } catch (parseError) {
          console.error('[StrategicAdvisor] JSON parse error:', parseError);
        }
      }
      
      // If no valid JSON, return a fallback
      return {
        insights: [
          {
            emoji: "📊",
            title: "Analysis Complete",
            description: "The AI analyzed your data but couldn't format the response. Please try again.",
            recommendation: "Check your data and try again."
          }
        ]
      };
    } catch (error: any) {
      console.error('[StrategicAdvisor] Error:', error?.message || error);
      return {
        insights: [
          {
            emoji: "⚠️",
            title: "Analysis Unavailable",
            description: error?.message || "Could not complete the analysis at this time.",
            recommendation: "Please try again later or check your data."
          }
        ]
      };
    }
  }
);
