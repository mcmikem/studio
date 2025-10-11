'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { KNOWLEDGE_BASE } from '@/lib/data';

export const AssistantInputSchema = z.object({
  history: z.array(
    z.object({
      role: z.enum(['user', 'model']),
      content: z.array(z.object({ text: z.string() })),
    })
  ),
});

export const assistantFlow = ai.defineFlow(
  {
    name: 'assistantFlow',
    inputSchema: AssistantInputSchema,
    outputSchema: z.string(),
  },
  async ({ history }) => {
    const { stream, response } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: {
        system: KNOWLEDGE_BASE,
        messages: history,
      },
      stream: true,
    });

    // Since we are streaming, we will return the streamed response directly from the API route.
    // This flow definition is primarily for registration with Genkit's dev UI.
    // The actual response to the client is handled by the API route that streams the output.
    let fullText = '';
    for await (const chunk of stream) {
      fullText += chunk.text;
    }
    return fullText;
  }
);
