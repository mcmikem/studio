
'use server';

/**
 * @fileOverview A collection of Genkit tools for accessing Omuto Foundation data.
 */

import { ai } from '@/ai/genkit';
import { initializeFirebase } from '@/firebase/server';
import { collection, query, where, orderBy, getDocs, Timestamp, limit } from 'firebase/firestore';
import { z } from 'zod';
import { format } from 'date-fns';

export const getUpcomingEvents = ai.defineTool(
  {
    name: 'getUpcomingEvents',
    description: 'Get a list of upcoming calendar events for the organization for the next 7 days.',
    inputSchema: z.object({}),
    outputSchema: z.array(z.object({
        title: z.string(),
        date: z.string(),
        category: z.string(),
        responsible: z.string(),
    })),
  },
  async () => {
    const { firestore } = await initializeFirebase();
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const eventsQuery = query(
      collection(firestore, 'events'),
      where('date', '>=', Timestamp.fromDate(today)),
      where('date', '<=', Timestamp.fromDate(sevenDaysFromNow)),
      orderBy('date', 'asc')
    );

    const snapshot = await getDocs(eventsQuery);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            title: data.title,
            date: format(data.date.toDate(), 'eeee, MMM d'),
            category: data.category,
            responsible: data.responsible,
        }
    });
  }
);


export const getPendingTasks = ai.defineTool(
  {
    name: 'getPendingTasks',
    description: "Get a specific user's list of pending (not completed) tasks.",
    inputSchema: z.object({ userId: z.string() }),
    outputSchema: z.array(z.object({
        title: z.string(),
        dueDate: z.string().optional(),
    })),
  },
  async ({ userId }) => {
    const { firestore } = await initializeFirebase();
    
    const tasksQuery = query(
        collection(firestore, 'users', userId, 'tasks'),
        where('completed', '==', false),
        orderBy('createdAt', 'desc'),
        limit(5) // Limit to the 5 most recent pending tasks to keep the context small
    );

    const snapshot = await getDocs(tasksQuery);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            title: data.title,
            dueDate: data.dueDate ? format(new Date(data.dueDate), 'eeee, MMM d') : undefined,
        }
    });
  }
);
