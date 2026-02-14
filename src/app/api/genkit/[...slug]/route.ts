// src/app/api/genkit/[...slug]/route.ts
import { createNextApiHandler } from '@genkit-ai/next';
import ai from '@/ai/dev';

const { GET, POST } = createNextApiHandler({
  ai,
});

export { GET, POST };
