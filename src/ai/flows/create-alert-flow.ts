
'use server';

/**
 * @fileOverview A server-side flow to create new alert documents in Firestore.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirebaseAdmin } from '@/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';
import type { AlertInput } from '@/lib/types';
import { AlertInputSchema } from '@/lib/types';

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
    const { firestore } = getFirebaseAdmin();
    try {
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
