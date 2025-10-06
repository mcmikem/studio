'use server';

/**
 * @fileOverview The main AI assistant flow for Omuto Central.
 * This assistant uses tools to access live data and provide contextual answers.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/server';

const KNOWLEDGE_BASE = `You are an expert AI assistant for the Omuto Foundation, a youth-led nonprofit in Mpigi, Uganda. Your role is to provide accurate, helpful, and concise information to team members, acting as a professional guide for planning, reporting, data analysis, and M&E. You must ensure all guidance aligns with Omuto's operational standards and philosophy.

You have access to live data about the organization through your tools. Use them whenever possible to provide real-time information.

This is your knowledge base. It is the complete operational DNA of Omuto Foundation.

## CORE IDENTITY & BELIEF SYSTEM
- **Organization**: Omuto Foundation
- **Motto**: "Empowering Youth, Transforming Communities"
- **Founded**: 2019
- **Location**: Mpigi District, Uganda
- **Core Belief**: "We do not run six separate programs. We manage a single, integrated ecosystem that transforms a young person into a self-reliant community leader."
- **Single Goal**: To create a self-sustaining cycle of youth-led development.

## THE OMUTO ECOSYSTEM MODEL
### Three Phases of Youth Journey:
- **PHASE 1: IDENTIFY & INSPIRE**: Entry points are the Student Leaders Forum (SLF) in schools (training RED Brigades for health and Green Teams for environment) and the Football Alliance in the community. The bridge is Interschool Debates.
- **PHASE 2: EQUIP & EMPOWER**: The Youth Innovation Summit provides entrepreneurship training. YAP Chapters (village-based youth groups) design community projects with Omuto's mentorship and support.
- **PHASE 3: ACTIVATE & SUSTAIN**: YoSkills Circles offer vocational training (computing, baking, tailoring, soap-making). Omuto Essentials is the social enterprise producing soap and sanitary pads. Community Mobilization happens through the Omuto Cup and advocacy events.

### Three Supporting Pillars:
- **Omuto Pulse**: The media arm, acting as the ecosystem's nervous system and megaphone.
- **Talent Pipeline**: Nsamizi Internships leading to the Change Makers Academy, our leadership factory.
- **Youth Centre**: The physical hub for all ecosystem activities.

## CURRENT TEAM STRUCTURE (October 2025)
- **McMike Mutumba (Executive Director)**: Strategic leadership, partnerships, vision.
- **Nansikombi Dianah (Programs & Partnerships Manager)**: Oversees all programs, partnership development, reporting.
- **Kasirye Constantine (Operations & Field Manager)**: Field ops, logistics, volunteer coordination.
- **Alex Nsereko (Media & Comms Lead + Finance)**: Omuto Pulse, social media, storytelling, financial accountability. Works with Jimmy (Videographer/Photographer).
- **Bwire Bashir (Field Coordinator, Butambala)**: School visits, youth clubs, RED & GreenSchools campaigns, field reporting.
- **Mr. Jon Paul Akera (Consultant, Resource Mobilisation Lead)**: Donor engagement, funding strategy, proposal writing.

## ACTIVE PROGRAMS & CAMPAIGNS
- **Omuto Youth Project (OYP)**: Includes SLF, RED Campaign (Menstrual Health), GreenSchools Campaign, PureWater Initiative, YoSkills, and YAP.
- **Omuto Talents Project (OTP)**: Includes Omuto Football Alliance (OFA), Omuto Cup.
- **Omuto Pulse**: Media platform.
- **Omuto Essentials**: Social enterprise for soap (8 outlets, new Watermelon wash) and Dignity Pads (in development).

## OCTOBER 2025 IMPLEMENTATION PLAN (Key Results)
- **KR1 (Fundraising)**: Increase Cycle of Dignity funding from 800K to 2M UGX by Oct 31.
- **KR2 (GreenSchools)**: Plant remaining 510 trees (of 700) by Oct 25.
- **KR3 (RED Campaign)**: Deliver sessions to 200 parents & 50 teachers by Oct 31.
- **KR4 (Partnerships)**: Secure 6 new partnership commitments by Oct 31.
- **KR5 (Football Gala)**: Complete framework (venue, budget, etc.) by Oct 28.
- **KR6 (YAP Chapters)**: Standardize SOPs for volunteers by Oct 25.
- **KR7 (Data)**: Implement field mapping and digital tracking system by Oct 31.
- **KR8 (Dignity Pads)**: Create 10 sample units of 5 prototype types by Oct 21.

## OPERATIONAL PHILOSOPHY & APPROACHES
- **Community-Led Execution**: Shift from staff-doing to community-owning. Use local volunteers and campus ambassadors.
- **Multiple Wins Framework**: Every activity must serve multiple purposes (e.g., combine trips, capture content, identify volunteers).
- **Template-Driven Efficiency**: Use standardized forms and SOPs for consistency.
- **Daily Operating Rhythm**: 9 AM WhatsApp check-in, 5 PM checkout, Friday reviews, Sunday "Omuto This Week" publication.
- **Innovation & Sustainability**: Focus on models like commission-based production for Dignity Pads and non-financial motivation for volunteers.
- **Data-Driven Adaptation**: Use real-time data to track progress, monitor health, and mitigate risks.
`;


const getProgramsTool = ai.defineTool(
  {
    name: 'getActivePrograms',
    description: 'Get a list of currently active Omuto Foundation programs from the database.',
    inputSchema: z.object({
      status: z.enum(['On Track', 'At Risk', 'Delayed', 'Completed']).optional().describe('Filter programs by status.'),
    }),
    outputSchema: z.array(z.object({
        title: z.string(),
        lead: z.string(),
        status: z.string(),
        deadline: z.string(),
    })),
  },
  async (input) => {
    try {
        const { firestore } = await initializeFirebase();
        const programsCol = collection(firestore, 'programs');
        let q = query(programsCol);

        if (input?.status) {
            q = query(q, where('status', '==', input.status));
        } else {
            q = query(q, where('status', '!=', 'Completed'));
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                title: data.title,
                lead: data.lead,
                status: data.status,
                deadline: data.deadline,
            }
        });
    } catch(e) {
        console.error("Error fetching active programs:", e);
        return [];
    }
  }
);

const getKeyResultsTool = ai.defineTool(
  {
      name: 'getOctoberKeyResults',
      description: "Get details about the Key Results (KRs) for Omuto's October Operational Plan.",
      inputSchema: z.object({
          priority: z.enum(['High', 'Medium', 'Low']).optional().describe('Filter KRs by priority level.'),
          krTitle: z.string().optional().describe('Get a specific KR by its title, e.g., "OCT-KR1".')
      }),
      outputSchema: z.array(z.object({
          title: z.string(),
          description: z.string(),
          currentProgress: z.number(),
          target: z.number(),
          deadline: z.string(),
          priority: z.string(),
      })),
  },
  async (input) => {
    try {
        const { firestore } = await initializeFirebase();
        const krCol = collection(firestore, 'key-results');
        let q = query(krCol);

        if (input?.priority) {
            q = query(q, where('priority', '==', input.priority));
        }
        if (input?.krTitle) {
            q = query(q, where('title', '==', input.krTitle));
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                title: data.title,
                description: data.description,
                currentProgress: data.currentProgress,
                target: data.target,
                deadline: data.deadline,
                priority: data.priority,
            }
        });
    } catch(e) {
        console.error("Error fetching key results:", e);
        return [];
    }
  }
);

const getPartnershipsTool = ai.defineTool(
    {
        name: 'getPartnerships',
        description: "Get information about Omuto's partner organizations.",
        inputSchema: z.object({
            status: z.enum(['Active', 'Potential', 'Inactive']).optional().describe('Filter partners by their status.'),
            name: z.string().optional().describe('Find a specific partner by name.'),
        }),
        outputSchema: z.array(z.object({
            name: z.string(),
            contactPerson: z.string(),
            contactEmail: z.string(),
            status: z.string(),
            nextStep: z.string(),
        })),
    },
    async (input) => {
        try {
            const { firestore } = await initializeFirebase();
            const partnersCol = collection(firestore, 'partnerships');
            let q = query(partnersCol);

            if (input?.status) {
                q = query(q, where('status', '==', input.status));
            }
            if (input?.name) {
                q = query(q, where('name', '==', input.name));
            }

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    name: data.name,
                    contactPerson: data.contactPerson,
                    contactEmail: data.contactEmail,
                    status: data.status,
                    nextStep: data.nextStep,
                }
            });
        } catch(e) {
            console.error("Error fetching partnerships:", e);
            return [];
        }
    }
);

const getRecentCheckoutsTool = ai.defineTool(
    {
        name: 'getRecentCheckouts',
        description: "Get the most recent daily checkout updates from team members.",
        inputSchema: z.object({
            userName: z.string().optional().describe("Filter checkouts by a specific team member's name."),
            limit: z.number().optional().default(5).describe('The number of recent checkouts to retrieve.'),
        }),
        outputSchema: z.array(z.object({
            name: z.string(),
            task: z.string(),
            timestamp: z.string(),
        })),
    },
    async (input) => {
        try {
            const { firestore } = await initializeFirebase();
            const checkoutsCol = collection(firestore, 'checkouts');
            let q = query(checkoutsCol, orderBy('timestamp', 'desc'), limit(input.limit || 5));

            if (input?.userName) {
                q = query(q, where('name', '==', input.userName));
            }

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    name: data.name,
                    task: data.task,
                    timestamp: data.timestamp.toDate().toLocaleString(),
                }
            });
        } catch(e) {
            console.error("Error fetching recent checkouts:", e);
            return [];
        }
    }
);

export const assistantFlow = ai.defineFlow(
  {
    name: 'assistantFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (prompt) => {
    const llmResponse = await ai.generate({
      prompt: prompt,
      system: KNOWLEDGE_BASE,
      tools: [getProgramsTool, getKeyResultsTool, getPartnershipsTool, getRecentCheckoutsTool],
    });
    
    return llmResponse.text;
  }
);


export async function streamAssistant(prompt: string) {
    const { stream, response } = ai.generateStream({
        prompt: prompt,
        system: KNOWLEDGE_BASE,
        tools: [getProgramsTool, getKeyResultsTool, getPartnershipsTool, getRecentCheckoutsTool],
    });
    
    let content = '';
    for await (const chunk of stream) {
        if (chunk.text) {
          content += chunk.text;
        }
    }
    return content;
}
