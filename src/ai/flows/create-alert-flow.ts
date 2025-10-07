
'use server';

/**
 * @fileOverview A server-side flow to create new alert documents in Firestore.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { initializeFirebase } from '@/firebase/server';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const AlertInputSchema = z.object({
  type: z.enum(['Urgent', 'Reminder', 'Info']),
  message: z.string(),
  priority: z.enum(['High', 'Medium', 'Low']),
  action: z.string(),
  // We can add a userId here in the future to target alerts to specific users
});

export type AlertInput = z.infer<typeof AlertInputSchema>;

export async function createAlert(input: AlertInput): Promise<{ id: string }> {
    return createAlertFlow(input);
}

const createAlertFlow = ai.defineFlow(
  {
    name: 'createAlertFlow',
    inputSchema: AlertInputSchema,
    outputSchema: z.object({ id: z.string() }),
  },
  async (alertData) => {
    try {
      const { firestore } = await initializeFirebase();
      const alertsCollection = collection(firestore, 'alerts');
      
      const newAlert = {
        ...alertData,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(alertsCollection, newAlert);
      
      return { id: docRef.id };

    } catch (e: any) {
      console.error("Error creating alert:", e);
      // In a real app, you might want to throw a more specific error
      throw new Error(`Failed to create alert: ${e.message}`);
    }
  }
);
