import { z } from 'zod';
import { callOpenRouter, DEFAULT_MODEL } from '@/lib/openrouter';
import { aiConfig } from '@/lib/ai';
import { ai } from '@/ai/genkit';

const EnterpriseInsightSchema = z.object({
  title: z.string(),
  insight: z.string(),
  priority: z.enum(['Low', 'Medium', 'High']),
  actionableStep: z.string()
});

export const EnterpriseAdvisorOutputSchema = z.object({
  insights: z.array(EnterpriseInsightSchema)
});

const enterpriseAdvisorPrompt = ai.definePrompt({
  name: 'enterpriseAdvisorPrompt',
  model: 'googleai/gemini-2.0-flash',
  system: `You are an AI Enterprise Advisor for Omuto Foundation's social enterprises.
Analyze sales, production, and inventory data to provide 1-2 critical, actionable insights.
- Look for stock-out risks
- Identify high-performing products
- Suggest production adjustments based on sales trends
- Be concise and direct.`,
  output: {
    schema: EnterpriseAdvisorOutputSchema
  }
});

export async function getEnterpriseInsights(input: {
  sales: any[];
  inventory: any[];
  production: any[]
}): Promise<{ insights: { title: string; insight: string; priority: 'Low' | 'Medium' | 'High'; actionableStep: string }[] }> {
  const { sales, inventory, production } = input;

  const prompt = `
Analyze this enterprise data:
- Recent Sales: ${JSON.stringify(sales).substring(0, 1000)}
- Current Inventory: ${JSON.stringify(inventory).substring(0, 1000)}
- Production History: ${JSON.stringify(production).substring(0, 1000)}

Provide 1-2 strategic insights.
`;

  if (aiConfig.provider === 'openrouter' && aiConfig.openRouterApiKey) {
    try {
      const systemPrompt = `You are an AI Enterprise Advisor. Return valid JSON only.`;
      const text = await callOpenRouter(prompt, systemPrompt, DEFAULT_MODEL, 0.5);

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          const validated = EnterpriseAdvisorOutputSchema.safeParse(parsed);
          if (validated.success) return validated.data as { insights: { title: string; insight: string; priority: 'Low' | 'Medium' | 'High'; actionableStep: string }[] };
        } catch (parseError) {
          console.error('[EnterpriseAdvisor] JSON parse failed:', parseError);
        }
      }
    } catch (error) {
      console.error('[EnterpriseAdvisor] OpenRouter failed:', error);
    }
  }

  try {
    const response = await enterpriseAdvisorPrompt({ input: prompt });
    if (response.output) {
      const validated = EnterpriseAdvisorOutputSchema.safeParse(response.output);
      if (validated.success) return validated.data as { insights: { title: string; insight: string; priority: 'Low' | 'Medium' | 'High'; actionableStep: string }[] };
    }
  } catch (error) {
    console.error('[EnterpriseAdvisor] Gemini failed:', error);
  }

  return {
    insights: [
      {
        title: "Manual Review Required",
        insight: "We couldn't generate automated insights at this time.",
        priority: "Low",
        actionableStep: "Please manually review your recent sales and stock levels."
      }
    ]
  };
}
