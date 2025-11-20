
'use server';

/**
 * @fileOverview A server-side flow to create new alert documents in Firestore.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { initializeFirebase } from '@/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';

const AlertInputSchema = z.object({
  type: z.enum(['Urgent', 'Reminder', 'Info']),
  message: z.string(),
  priority: z.enum(['High', 'Medium', 'Low']),
  action: z.string(),
  creatorId: z.string().describe("The ID of the user creating the alert."),
  targetUserIds: z.array(z.string()).optional().describe("An array of user IDs to target with this notification. If empty, it's a broadcast."),
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
      const alertsCollection = firestore.collection('alerts');
      
      const newAlert = {
        ...alertData,
        createdAt: FieldValue.serverTimestamp(),
        readBy: [],
        targetUserIds: alertData.targetUserIds || [], // Ensure the field exists
      };

      const docRef = await alertsCollection.add(newAlert);
      
      return { id: docRef.id };

    } catch (e: any) {
      console.error("Error creating alert:", e);
      // In a real app, you might want to throw a more specific error
      throw new Error(`Failed to create alert: ${e.message}`);
    }
  }
);
