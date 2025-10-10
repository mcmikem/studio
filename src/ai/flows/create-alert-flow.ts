
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
  creatorId: z.string().describe("The ID of the user creating the alert."),
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
    // In a production app, you would add security logic here.
    // For example, check if the creator (alertData.creatorId) has the permission
    // to create alerts of this type or for the target users.
    // e.g., if (userRole !== 'admin') throw new Error('Permission denied');

    try {
      const { firestore } = await initializeFirebase();
      const alertsCollection = collection(firestore, 'alerts');
      
      const newAlert = {
        type: alertData.type,
        message: alertData.message,
        priority: alertData.priority,
        action: alertData.action,
        creatorId: alertData.creatorId,
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

    