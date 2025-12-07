
import { genkit } from 'genkit';

// Centralized AI object registry.
// This is safe to import in both client and server components.
// The actual plugin configuration is done in `dev.ts`.
export const ai = genkit();
