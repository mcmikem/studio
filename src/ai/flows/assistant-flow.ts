'use server';
/**
 * @fileOverview A simple AI assistant flow that streams responses.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AssistantInputSchema = z.object({
  history: z.array(
    z.object({
      role: z.enum(['user', 'model']),
      content: z.array(z.object({ text: z.string() })),
    })
  ),
  prompt: z.string(),
});

export type AssistantInput = z.infer<typeof AssistantInputSchema>;

export async function assistant(input: AssistantInput) {
  return assistantFlow(input);
}

export const assistantFlow = ai.defineFlow(
  {
    name: 'assistantFlow',
    inputSchema: AssistantInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const { history, prompt } = input;
    
    const response = await ai.generate({
      prompt: prompt,
      history: history,
      stream: true,
    });
    
    let fullResponse = '';
    for await (const chunk of response.stream()) {
      fullResponse += chunk.text;
    }
    
    return fullResponse;
  }
);
