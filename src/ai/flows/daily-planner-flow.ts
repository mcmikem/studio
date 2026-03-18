
/**
 * @fileOverview Hybrid Daily Planner AI Flow
 * Uses OpenRouter for AI generation
 */

import { callOpenRouter, DEFAULT_MODEL } from '@/lib/openrouter';
import { aiConfig } from '@/lib/ai';
import { 
  DailyPlannerAIInputSchema, 
  DailyPlannerAIOutputSchema,
  type DailyPlannerAIInput,
  type DailyPlannerAIOutput 
} from '@/lib/types';
import { z } from 'zod';

import { ai } from '@/ai/genkit';

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

export async function generateDailyPlan(input: z.infer<typeof plannerInputSchema>): Promise<DailyPlannerAIOutput> {
  const { userName, userRole, primaryMission, weeklyPriorities = [], keyResults = [] } = input;
  
  const strategyContext = keyResults.length > 0 
    ? `\n\nStrategic Objectives to align with:\n${keyResults.map(kr => `- ${kr.title}: ${kr.description}`).join('\n')}`
    : '';
  
  const weeklyContext = weeklyPriorities.length > 0
    ? `\n\nThis week's priorities:\n${weeklyPriorities.map(p => `- ${p}`).join('\n')}`
    : '';

  const systemPrompt = `You are a high-performance productivity coach for the Omuto Foundation.
Your goal is to transform a "Primary Mission" into a structured, strategic daily plan.
You MUST return ONLY valid JSON. No markdown backticks, no preamble.
JSON Schema:
{
  "timeBlocks": [ { "startTime": "HH:MM", "endTime": "HH:MM", "description": "string" } ],
  "strategicAlignments": [ { "krTitle": "string", "alignmentJustification": "string" } ],
  "materials": "string",
  "challenges": "string",
  "bestPractice": "string"
}`;

  const prompt = `
Generate a daily plan for ${userName} (${userRole}).
Primary Mission: ${primaryMission}
${weeklyContext}
${strategyContext}

Example Output Format:
{
  "timeBlocks": [
    { "startTime": "08:30", "endTime": "10:30", "description": "Deep work on report" }
  ],
  "strategicAlignments": [
    { "krTitle": "Goal 1", "alignmentJustification": "Critical for Q1 targets" }
  ],
  "materials": "Laptop, Drafts",
  "challenges": "Power outage possibilities",
  "bestPractice": "Focus on one thing at a time."
}

Return ONLY the JSON.`;

  // 1. Try OpenRouter if configured
  if (aiConfig.provider === 'openrouter' && aiConfig.openRouterApiKey) {
    try {
      const text = await callOpenRouter(prompt, systemPrompt, DEFAULT_MODEL, 0.7);
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // Validate with schema
        return DailyPlannerAIOutputSchema.parse(parsed);
      }
    } catch (error) {
      console.error('Daily Planner OpenRouter failed or invalid schema:', error);
    }
  }

  // 2. Try Gemini (Genkit) if configured
  if (aiConfig.isConfigured) {
      try {
          console.log('[DailyPlanner] Attempting Gemini generation');
          const response = await ai.generate({
              model: 'googleai/gemini-2.0-flash',
              system: systemPrompt,
              prompt,
          });
          
          const text = response.text;
          const jsonMatch = text?.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              // Validate with schema
              return DailyPlannerAIOutputSchema.parse(parsed);
          }
      } catch (error) {
          console.error('Daily Planner Gemini failed or invalid schema:', error);
      }
  }
  
  // 3. Last Fallback: offline algorithm
  console.log('[DailyPlanner] Using offline fallback');
  return generateOfflinePlan({ primaryMission, keyResults });
}

// Keep the offline function for fallback
export function generateOfflinePlan(input: { primaryMission: string; keyResults?: any[] }): DailyPlannerAIOutput {
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
