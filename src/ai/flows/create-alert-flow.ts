
import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { getFirebaseAdmin } from '@/firebase/server';
import { Timestamp } from 'firebase-admin/firestore';


export const AlertInputSchema = z.object({
  type: z.enum(['Urgent', 'Reminder', 'Info']),
  message: z.string(),
  priority: z.enum(['High', 'Medium', 'Low']),
  action: z.string(),
  creatorId: z.string(),
  targetUserIds: z.array(z.string()).optional(),
});
export type AlertInput = z.infer<typeof AlertInputSchema>;

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
