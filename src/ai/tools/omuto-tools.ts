
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

export const findGrantOpportunities = ai.defineTool(
  {
    name: 'findGrantOpportunities',
    description: 'Searches for grant and funding opportunities based on a query. This is a simulation and will return mock data.',
    inputSchema: z.object({
      query: z.string().describe('The search query, e.g., "youth empowerment uganda"'),
    }),
    outputSchema: z.array(
      z.object({
        title: z.string(),
        funder: z.string(),
        description: z.string(),
        amount: z.number(),
        deadline: z.string().describe("YYYY-MM-DD format"),
      })
    ),
  },
  async ({ query }) => {
    // This is a MOCK implementation. In a real app, this would call a real search API.
    console.log(`Simulating search for grant opportunities with query: "${query}"`);
    const MOCK_OPPORTUNITIES = [
      {
        title: 'Youth Empowerment & Skilling Grant 2025',
        funder: 'Global Youth Fund',
        description: 'Supports projects focused on vocational training and entrepreneurship for young people in East Africa.',
        amount: 50000000,
        deadline: '2025-12-15',
      },
      {
        title: 'Community Climate Action Fund',
        funder: 'Green Future Foundation',
        description: 'Provides funding for grassroots environmental projects, including tree planting and conservation education.',
        amount: 25000000,
        deadline: '2025-11-30',
      },
      {
        title: 'Digital Literacy for Rural Girls',
        funder: 'TechForShe',
        description: 'A grant for organizations providing digital skills and access to technology for girls in rural areas.',
        amount: 75000000,
        deadline: '2026-01-20',
      },
      {
        title: 'Menstrual Health Equity Grant',
        funder: 'Dignity for All Foundation',
        description: 'Funding for projects addressing menstrual health education and access to sanitary products.',
        amount: 30000000,
        deadline: '2025-12-01',
      },
    ];
    // Simple filter to make the mock data slightly responsive to the query
    return MOCK_OPPORTUNITIES.filter(op => op.description.toLowerCase().includes(query.split(' ')[0].toLowerCase()));
  }
);
