
import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { getFirebaseAdmin } from '@/firebase/server';
import { Timestamp } from 'firebase-admin/firestore';
import { AlertInputSchema } from '@/lib/types';
import type { AlertInput } from '@/lib/types';


export const createAlertFlow = ai.defineFlow(
    {
        name: 'createAlertFlow',
        inputSchema: AlertInputSchema,
        outputSchema: z.void(),
    },
    async (alertData) => {
        const { firestore } = getFirebaseAdmin();
        const alertPayload = {
            ...alertData,
            createdAt: Timestamp.now(),
            readBy: [],
        };
        await firestore.collection('alerts').add(alertPayload);
        console.log("Alert created:", alertData);
    }
);
