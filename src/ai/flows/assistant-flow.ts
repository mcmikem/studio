'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { KNOWLEDGE_BASE } from '@/lib/data';

const UserContextSchema = z.object({
  name: z.string().describe('The name of the user.'),
  role: z.string().describe('The role of the user within the organization.'),
});

const AssistantInputSchema = z.object({
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })),
  userContext: UserContextSchema,
});

const prompt = `You are the Omuto Foundation AI Assistant. Your role is to act as a helpful and knowledgeable partner for team members. Use the provided organizational knowledge base to answer questions accurately and concisely.

You are speaking to {{userContext.name}}, who is the {{userContext.role}}. Tailor your responses to be relevant to their role.

When asked for data (e.g., "What is our progress on KR1?"), you must state that you need to be connected to the live database to provide real-time information, as that functionality is under development.

Always be professional, encouraging, and aligned with Omuto's mission.

Organizational Knowledge Base:
---
${KNOWLEDGE_BASE}
---
`;

export const assistantFlow = ai.defineFlow(
  {
    name: 'assistantFlow',
    inputSchema: AssistantInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {

    const model = ai.getModel('googleai/gemini-2.5-flash');

    const { stream, response } = await ai.generateStream({
      model: model,
      prompt: {
        system: prompt,
        history: input.history.map(msg => ({...msg, parts: [{text: msg.content}]})),
      },
      context: {
        userContext: input.userContext,
      }
    });

    for await (const chunk of stream) {
        ai.stream(chunk.text);
    }
  }
);
