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
  const { stream, response } = await ai.generateStream({
    prompt: input.prompt,
    history: input.history,
  });

  const outputStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        controller.enqueue(chunk.text);
      }
      controller.close();
    },
  });

  await response;

  return new Response(outputStream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

// This was the missing export
export const assistantFlow = ai.defineFlow(
  {
    name: 'assistantFlow',
    inputSchema: AssistantInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    return await assistant(input) as any;
  }
);
