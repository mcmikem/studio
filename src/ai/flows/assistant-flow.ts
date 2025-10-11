'use server';
/**
 * @fileOverview A simple AI assistant flow that streams responses.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { NextRequest, NextResponse } from 'next/server';

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
    
    const { stream, response } = ai.generateStream({
      prompt: prompt,
      history: history,
    });
    
    const outputStream = new ReadableStream({
        async start(controller) {
            for await (const chunk of stream) {
                controller.enqueue(chunk.text);
            }
            controller.close();
        }
    });

    return new NextResponse(outputStream, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8'
        }
    }) as any;
  }
);
