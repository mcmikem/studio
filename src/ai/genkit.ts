
import { genkit } from 'genkit';

// Centralized AI configuration, without plugins.
// Plugins will be attached by the server environment (e.g., dev.ts or a production entry point).
export const ai = genkit();
