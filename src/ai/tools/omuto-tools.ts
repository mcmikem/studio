
'use server';

/**
 * @fileOverview A collection of Genkit tools for accessing Omuto Foundation data.
 * IMPORTANT: These tools may use the Admin SDK and should only be used in server-side flows.
 */

import { ai } from '@/ai/genkit';
import { initializeFirebase } from '@/firebase/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { z } from 'zod';

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


export const findUsersByName = ai.defineTool(
    {
        name: 'findUsersByName',
        description: 'Finds staff members by their name.',
        inputSchema: z.object({
            name: z.string().describe("The name of the staff member to search for."),
        }),
        outputSchema: z.array(
            z.object({
                id: z.string(),
                type: z.literal('User'),
                title: z.string(),
                url: z.string(),
            })
        ),
    },
    async ({ name }) => {
        const { firestore } = await initializeFirebase();
        const usersRef = collection(firestore, 'users');
        
        // Firestore doesn't support case-insensitive or partial text search natively.
        // A common workaround is to use range queries on a capitalized version of the name.
        const q = query(
            usersRef,
            where('name', '>=', name),
            where('name', '<=', name + '\uf8ff')
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return [];
        }

        return snapshot.docs.map(doc => ({
            id: doc.id,
            type: 'User',
            title: doc.data().name,
            url: `/profile?userId=${doc.id}`,
        }));
    }
);

export const findProgramsByName = ai.defineTool(
    {
        name: 'findProgramsByName',
        description: 'Finds programs by their title.',
        inputSchema: z.object({
            title: z.string().describe("The title of the program to search for."),
        }),
        outputSchema: z.array(
            z.object({
                id: z.string(),
                type: z.literal('Program'),
                title: z.string(),
                url: z.string(),
            })
        ),
    },
    async ({ title }) => {
        const { firestore } = await initializeFirebase();
        const programsRef = collection(firestore, 'programs');
        
        const q = query(
            programsRef,
            where('title', '>=', title),
            where('title', '<=', title + '\uf8ff')
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return [];
        }

        return snapshot.docs.map(doc => ({
            id: doc.id,
            type: 'Program',
            title: doc.data().title,
            url: `/management/programs`,
        }));
    }
);


export const findExpensesByTitle = ai.defineTool(
    {
        name: 'findExpensesByTitle',
        description: 'Finds expense reports by their title.',
        inputSchema: z.object({
            title: z.string().describe("The title of the expense report to search for."),
        }),
        outputSchema: z.array(
            z.object({
                id: z.string(),
                type: z.literal('Expense'),
                title: z.string(),
                url: z.string(),
            })
        ),
    },
    async ({ title }) => {
        const { firestore } = await initializeFirebase();
        const expensesRef = collection(firestore, 'expenses');
        
        const q = query(
            expensesRef,
            where('title', '>=', title),
            where('title', '<=', title + '\uf8ff')
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return [];
        }

        return snapshot.docs.map(doc => ({
            id: doc.id,
            type: 'Expense',
            title: doc.data().title,
            url: `/management/expenses?highlight=${doc.id}`,
        }));
    }
);
