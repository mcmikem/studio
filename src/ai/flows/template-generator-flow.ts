
/**
 * @fileOverview AI Template Generator Flow
 * Generates custom operational templates using AI
 */

import { ai } from '@/ai/genkit';
import { callOpenRouter, DEFAULT_MODEL } from '@/lib/openrouter';
import { aiConfig } from '@/lib/ai';
import { 
  GenerateTemplateInputSchema, 
  GenerateTemplateOutputSchema,
  type GenerateTemplateInput,
  type GenerateTemplateOutput 
} from '@/lib/types';
import { z } from 'zod';

const templatePrompt = ai.definePrompt({
  name: 'templatePrompt',
  model: 'googleai/gemini-2.0-flash',
  system: `You are an expert operational assistant for the Omuto Foundation, a youth-led NGO in Uganda.
Create practical, actionable checklists and templates that field staff can use immediately.
- Be specific to the Ugandan context where relevant
- Keep items concise and actionable
- Include 5-8 items per checklist`,
  output: {
    schema: z.object({
      title: z.string(),
      checklistItems: z.array(z.string()),
    }),
  },
});

export const templateGeneratorFlow = ai.defineFlow(
  {
    name: 'templateGeneratorFlow',
    inputSchema: GenerateTemplateInputSchema,
    outputSchema: GenerateTemplateOutputSchema,
  },
  async (input): Promise<GenerateTemplateOutput> => {
    const { description } = input;
    
    const prompt = `
Create an operational checklist or template for: ${description}

Return a JSON object with:
- title: A clear, descriptive title for this template
- checklistItems: Array of 5-8 specific action items to complete this task

Make the items specific and actionable for NGO field operations in Uganda.
`;

    // 1. Try OpenRouter First
    if (aiConfig.provider === 'openrouter' && aiConfig.openRouterApiKey) {
      try {
        const systemPrompt = `You are an expert operational assistant for the Omuto Foundation. Return valid JSON only.`;
        const text = await callOpenRouter(prompt, systemPrompt, DEFAULT_MODEL, 0.7);
        
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (error) {
        console.error('Template Generator OpenRouter failed:', error);
      }
    }

    // 2. Try Gemini
    try {
      const response = await templatePrompt({ input: prompt });
      
      // With output schema, response has output property
      if (response.output) {
        return response.output;
      }
      
      // Fallback: try to parse JSON from text
      const text = response.text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
      }
    } catch (error) {
      console.error('Template AI Gemini failed:', error);
    }

    // 3. Last Fallback: Offline
    console.log('[TemplateGenerator] Using offline fallback');
    return generateOfflineTemplate(input);
  }
);

// Offline fallback template generator
export function generateOfflineTemplate(input: GenerateTemplateInput): GenerateTemplateOutput {
  const { description } = input;
  const lowerDesc = description.toLowerCase();

  const library = [
      {
          keywords: ['volunteer', 'onboarding', 'staff', 'recruit'],
          title: 'Volunteer Onboarding Checklist',
          checklistItems: [
              'Collect signed ID documents and contact info',
              'Briefing on Omuto Foundation mission and values',
              'Safety and code of conduct training',
              'Assign to a field supervisor',
              'Provision with necessary field materials (manual, laptop)'
          ]
      },
      {
          keywords: ['inspection', 'facility', 'safety', 'site'],
          title: 'Facility Safety Inspection',
          checklistItems: [
              'Verify all fire extinguishers are serviced and accessible',
              'Inspect electrical outlets and wiring for damage',
              'Check first aid kits for expired supplies',
              'Ensure all exit paths are clear of obstructions',
              'Test emergency lighting and backup power'
          ]
      },
      {
          keywords: ['event', 'planning', 'meeting', 'community'],
          title: 'Community Event Planning',
          checklistItems: [
              'Define event objectives and target audience',
              'Secure venue and verify local permits',
              'Draft and distribute event invitations',
              'Arrange logistics (transport, seating, sound)',
              'Prepare presentation materials and feedback forms'
          ]
      },
      {
          keywords: ['financial', 'reconciliation', 'budget', 'expense'],
          title: 'Monthly Financial Reconciliation',
          checklistItems: [
              'Gather all receipts and invoices for the period',
              'Compare bank statements with recorded expenses',
              'Categorize all transactions in the ledger',
              'Flag and investigate any discrepancies',
              'Generate final monthly expenditure report'
          ]
      }
  ];

  const match = library.find(item => 
      item.keywords.some(kw => lowerDesc.includes(kw))
  ) || {
      title: 'Custom Operational Checklist',
      checklistItems: [
          'Define objective for this task',
          'Identify key personnel involved',
          'Determine required materials and budget',
          'Establish timeline and milestones',
          'Define success criteria and reporting flow'
      ]
  };

  return {
      title: match.title,
      checklistItems: match.checklistItems
  };
}
