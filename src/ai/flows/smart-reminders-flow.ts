
'use server';

/**
 * @fileOverview A flow to generate dynamic, context-aware reminders for a user.
 */
import { ai } from '@/ai/genkit';
import type { SmartRemindersOutput, SmartRemindersInput } from '@/lib/types';
import { smartRemindersPrompt } from '@/ai/definitions';


export async function generateSmartReminders(input: SmartRemindersInput): Promise<SmartRemindersOutput> {
    const {output} = await smartRemindersPrompt(input);
    
    if (!output) {
      throw new Error('AI failed to generate reminders.');
    }
    
    return output;
}
