
/**
 * @fileOverview Hybrid Daily Planner AI Flow
 * Uses algorithmic planning as base, optionally enhanced by AI when online
 */

import { ai } from '@/ai/genkit';
import { 
  DailyPlannerAIInputSchema, 
  DailyPlannerAIOutputSchema,
  type DailyPlannerAIInput,
  type DailyPlannerAIOutput 
} from '@/lib/types';
import { z } from 'zod';

const plannerPrompt = ai.definePrompt({
  name: 'dailyPlannerPrompt',
  model: 'googleai/gemini-2.0-flash',
  system: `You are an expert productivity assistant for the Omuto Foundation, a youth-led NGO in Uganda.
Your role is to help staff and volunteers plan their day strategically.
- Be practical and realistic about time allocations
- Consider the organization's strategic objectives (Key Results)
- Be concise and action-oriented
- When suggesting time blocks, always include specific descriptions of what to do
- Prioritize impact over busyness`,
});

const plannerInputSchema = z.object({
  userName: z.string(),
  userRole: z.string(),
  primaryMission: z.string(),
  weeklyPriorities: z.array(z.string()).optional(),
  keyResults: z.array(z.object({
    title: z.string(),
    description: z.string(),
    deadline: z.string(),
  })).optional(),
});

export const dailyPlannerFlow = ai.defineFlow(
  {
    name: 'dailyPlannerFlow',
    inputSchema: plannerInputSchema,
    outputSchema: DailyPlannerAIOutputSchema,
  },
  async (input): Promise<DailyPlannerAIOutput> => {
    const { userName, userRole, primaryMission, weeklyPriorities = [], keyResults = [] } = input;
    
    const strategyContext = keyResults.length > 0 
      ? `\n\nStrategic Objectives to align with:\n${keyResults.map(kr => `- ${kr.title}: ${kr.description}`).join('\n')}`
      : '';
    
    const weeklyContext = weeklyPriorities.length > 0
      ? `\n\nThis week's priorities:\n${weeklyPriorities.map(p => `- ${p}`).join('\n')}`
      : '';

    const prompt = `
Create a detailed daily plan for ${userName} (${userRole}) at Omuto Foundation.

Primary Mission: ${primaryMission}
${weeklyContext}
${strategyContext}

Return a JSON object with:
1. timeBlocks: Array of {startTime, endTime, description} - 6-8 time blocks for a productive day
2. strategicAlignments: Array of {krTitle, alignmentJustification} - How the day's work connects to strategic objectives
3. materials: String - What materials/resources are needed
4. challenges: String - Potential challenges to anticipate
5. bestPractice: String - One actionable productivity tip

Keep time blocks realistic (8:30 AM to 5 PM with lunch break).
Ensure strategic alignments are specific to the mission and actual key results.
`;

    try {
      const response = await plannerPrompt({ input: prompt });
      const text = response.text;
      
      // Try to parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
      }
      
      // Fallback if no valid JSON
      throw new Error('Could not parse AI response');
    } catch (error) {
      console.error('Daily Planner AI failed, using fallback:', error);
      throw error;
    }
  }
);

// Offline algorithm-based planner (works without AI)
export function generateOfflinePlan(input: DailyPlannerAIInput): DailyPlannerAIOutput {
  const { primaryMission, keyResults = [] } = input;
  
  const missionLower = primaryMission.toLowerCase();
  
  // Keyword matching for strategic alignment
  const alignments = keyResults
    .map((kr: any) => {
      const krMatches = kr.title.toLowerCase().split(/\s+/)
        .some((word: string) => word.length > 3 && missionLower.includes(word));
      return { kr, matches: krMatches };
    })
    .filter((a: any) => a.matches)
    .slice(0, 2)
    .map((a: any) => ({
      krTitle: a.kr.title,
      alignmentJustification: `Directly supports "${a.kr.title}" through focused execution on "${primaryMission}".`
    }));

  // Fallback if no keyword matches
  if (alignments.length === 0 && keyResults.length > 0) {
    alignments.push({
      krTitle: keyResults[0].title,
      alignmentJustification: `Contributes to overall program goals by completing mission-critical tasks: "${primaryMission}".`
    });
  }

  // Time blocks based on mission type
  const timeBlocks = [
    { startTime: "08:30", endTime: "09:00", description: "Morning briefing & team sync" },
    { startTime: "09:00", endTime: "11:00", description: `Primary Focus: ${primaryMission} (Deep Work)` },
    { startTime: "11:00", endTime: "12:00", description: "Coordination & stakeholder communication" },
    { startTime: "12:00", endTime: "13:00", description: "Lunch break" },
    { startTime: "13:00", endTime: "15:00", description: `Continuation: ${primaryMission}` },
    { startTime: "15:00", endTime: "16:00", description: "Documentation & impact evidence collection" },
    { startTime: "16:00", endTime: "17:00", description: "Daily check-out & tomorrow's prep" }
  ];

  const tips = [
    "Eat the Frog: Start with your most difficult task first.",
    "Use Pomodoro: Work in 25-minute sprints to maintain high focus.",
    "Single-tasking: Multitasking reduces quality; focus on one priority at a time.",
    "Batching: Respond to all communications in one structured block of time."
  ];

  return {
    timeBlocks,
    strategicAlignments: alignments,
    materials: "Laptop, Omuto Field Manual, reliable internet connection, and task-specific documentation.",
    challenges: "Potential connectivity issues, transit delays, or urgent ad-hoc coordination requests.",
    bestPractice: tips[Math.floor(Math.random() * tips.length)]
  };
}
