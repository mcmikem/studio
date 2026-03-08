'use server';

import { getFirebaseAdmin } from '@/firebase/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { format } from 'date-fns';
import { roleKpis } from '@/lib/data';
import type { AlertInput, GrantFinderInput, GrantFinderOutput, SmartRemindersInput, SmartRemindersOutput, DailyPlannerAIInput, DailyPlannerAIOutput, GenerateTemplateInput, GenerateTemplateOutput } from '@/lib/types';

export async function createAlertAction(input: AlertInput) {
    try {
        const { firestore } = getFirebaseAdmin();
        const alertPayload = {
            ...input,
            createdAt: Timestamp.now(),
            readBy: [],
        };
        await firestore.collection('alerts').add(alertPayload);
        return { success: true };
    } catch (error) {
        console.error('Server Action Error - createAlertAction:', error);
        return { success: false, error: 'Failed to create alert.' };
    }
}

export async function createTestimonyAction(data: any) {
    try {
        const { firestore } = getFirebaseAdmin();
        
        const docRef = await firestore.collection('testimonies').add({
            ...data,
            createdAt: FieldValue.serverTimestamp()
        });
        
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Server Action Error - createTestimonyAction:', error);
        return { success: false, error: 'Failed to securely construct the testimony record on the server.' };
    }
}

// ─── Grant Finder (replaces AI flow → deterministic keyword search) ───

const GRANT_OPPORTUNITIES = [
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
    {
        title: 'Rural Education Access Initiative',
        funder: 'Educate Africa Foundation',
        description: 'Funding for programs improving school attendance, teacher training, and classroom infrastructure in rural communities.',
        amount: 40000000,
        deadline: '2026-03-01',
    },
    {
        title: 'Clean Water & Sanitation Project Fund',
        funder: 'AquaLife International',
        description: 'Supports community-led water and sanitation initiatives including borehole construction and hygiene education.',
        amount: 60000000,
        deadline: '2026-02-15',
    },
];

export async function findGrantsAction(input: GrantFinderInput): Promise<GrantFinderOutput> {
    const queryWords = input.query.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);

    if (queryWords.length === 0) {
        return { opportunities: GRANT_OPPORTUNITIES };
    }

    // Score each opportunity by how many query words appear in its searchable text
    const scored = GRANT_OPPORTUNITIES.map(op => {
        const searchText = `${op.title} ${op.funder} ${op.description}`.toLowerCase();
        const score = queryWords.reduce((acc: number, word: string) => acc + (searchText.includes(word) ? 1 : 0), 0);
        return { op, score };
    });

    // Return matches sorted by relevance, or all if nothing matched
    // Return matches sorted by relevance, or all if nothing matched
    const matches = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score);
    return {
        opportunities: matches.length > 0 ? matches.map(m => m.op) : GRANT_OPPORTUNITIES,
    };
}

// ─── Smart Reminders (replaces AI flow → deterministic rule engine) ───

export async function generateSmartRemindersAction(input: SmartRemindersInput): Promise<SmartRemindersOutput> {
    try {
        const { firestore } = getFirebaseAdmin();
        const { userId, userName, userRole } = input;

        // 1. Get upcoming events (next 7 days)
        const today = new Date();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(today.getDate() + 7);

        const eventsSnapshot = await firestore.collection('events')
            .where('date', '>=', Timestamp.fromDate(today))
            .where('date', '<=', Timestamp.fromDate(sevenDaysFromNow))
            .orderBy('date', 'asc')
            .get();

        // 2. Get pending tasks (top 5)
        const tasksSnapshot = await firestore.collection('users').doc(userId).collection('tasks')
            .where('completed', '==', false)
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();

        const reminders: string[] = [];

        // Process Events
        if (!eventsSnapshot.empty) {
            eventsSnapshot.docs.slice(0, 2).forEach(doc => {
                const ev = doc.data();
                const dateStr = format(ev.date.toDate(), 'eeee, MMM d');
                reminders.push(`📅 Upcoming: "${ev.title}" on ${dateStr}.`);
            });
        }

        // Process Tasks
        if (!tasksSnapshot.empty) {
            const count = tasksSnapshot.size;
            const topTask = tasksSnapshot.docs[0].data().title;
            reminders.push(`📝 You have ${count} pending tasks. Top priority: "${topTask}".`);
        } else {
            reminders.push(`✅ All caught up on tasks! Great job, ${userName}.`);
        }

        // Strategic Alignment (Role-based)
        const kpis = roleKpis[userRole] || [];
        if (kpis.length > 0) {
            const randomKpi = kpis[Math.floor(Math.random() * kpis.length)];
            reminders.push(`💡 Strategic Alignment: ${randomKpi.title} - ${randomKpi.description}`);
        }

        return { reminders };
    } catch (error) {
        console.error('Server Action Error - generateSmartRemindersAction:', error);
        return { reminders: ["Could not load reminders at this time. Please check your connection."] };
    }
}

// ─── Daily Planner (replaces AI flow → structured builder) ───

export async function generateDailyPlanAction(input: DailyPlannerAIInput): Promise<DailyPlannerAIOutput> {
    const { primaryMission, keyResults = [] } = input;
    
    // 1. Determine Strategic Alignment (Keyword matching)
    const missionLower = primaryMission.toLowerCase();
    const alignments = keyResults
        .map((kr: any) => {
            const krMatches = kr.title.toLowerCase().split(/\s+/).some((word: string) => word.length > 3 && missionLower.includes(word));
            return { kr, matches: krMatches };
        })
        .filter((a: any) => a.matches)
        .slice(0, 2)
        .map((a: any) => ({
            krTitle: a.kr.title,
            alignmentJustification: `Directly supports "${a.kr.title}" through focused execution on "${primaryMission}".`
        }));

    // Fallback if no keyword matches
    if (alignments.length === 0 && keyResults.length > 0) {
        alignments.push({
            krTitle: keyResults[0].title,
            alignmentJustification: `Contributes to overall program goals by completing mission-critical tasks: "${primaryMission}".`
        });
    }

    // 2. Build Time Blocks based on role
    const timeBlocks = [
        { startTime: "08:30", endTime: "09:00", description: "Morning Briefing & Review" },
        { startTime: "09:00", endTime: "12:00", description: `Deep Work: ${primaryMission}` },
        { startTime: "12:00", endTime: "13:00", description: "Lunch & Refuel" },
        { startTime: "13:00", endTime: "14:30", description: "Team Sync & Operational Coordination" },
        { startTime: "14:30", endTime: "16:30", description: "Documentation & Next Step Planning" },
        { startTime: "16:30", endTime: "17:00", description: "Daily Check-out & Briefing preparation" }
    ];

    // 3. Static Resources & Challenges
    const materials = "Laptop, Omuto Field Manual, reliable internet connection, and task-specific documentation.";
    const challenges = "Potential connectivity issues, transit delays, or urgent ad-hoc coordination requests.";
    
    // 4. Random Best Practice
    const tips = [
        "Eat the Frog: Start with your most difficult task first.",
        "Use Pomodoro: Work in 25-minute sprints to maintain high focus.",
        "Single-tasking: Multitasking reduces quality; focus on one priority at a time.",
        "Batching: Respond to all communications in one structured block of time."
    ];
    const bestPractice = tips[Math.floor(Math.random() * tips.length)];

    return {
        timeBlocks,
        strategicAlignments: alignments,
        materials,
        challenges,
        bestPractice
    };
}

// ─── SOP Template Generator (replaces AI flow → Library selector) ───

export async function generateTemplateAction(input: GenerateTemplateInput): Promise<GenerateTemplateOutput> {
    const { description } = input;
    const lowerDesc = description.toLowerCase();

    const library = [
        {
            keywords: ['volunteer', 'onboarding', 'staff', 'recruit'],
            title: 'Volunteer Onboarding Checklist',
            checklistItems: [
                'Collect signed ID documents and contact info',
                'Briefing on Omuto Foundation mission and values',
                'Safety and code of conduct training',
                'Assign to a field supervisor',
                'Provision with necessary field materials (manual, laptop)'
            ]
        },
        {
            keywords: ['inspection', 'facility', 'safety', 'site'],
            title: 'Facility Safety Inspection',
            checklistItems: [
                'Verify all fire extinguishers are serviced and accessible',
                'Inspect electrical outlets and wiring for damage',
                'Check first aid kits for expired supplies',
                'Ensure all exit paths are clear of obstructions',
                'Test emergency lighting and backup power'
            ]
        },
        {
            keywords: ['event', 'planning', 'meeting', 'community'],
            title: 'Community Event Planning',
            checklistItems: [
                'Define event objectives and target audience',
                'Secure venue and verify local permits',
                'Draft and distribute event invitations',
                'Arrange logistics (transport, seating, sound)',
                'Prepare presentation materials and feedback forms'
            ]
        },
        {
            keywords: ['financial', 'reconciliation', 'budget', 'expense'],
            title: 'Monthly Financial Reconciliation',
            checklistItems: [
                'Gather all receipts and invoices for the period',
                'Compare bank statements with recorded expenses',
                'Categorize all transactions in the ledger',
                'Flag and investigate any discrepancies',
                'Generate final monthly expenditure report'
            ]
        }
    ];

    // Find best match
    const match = library.find(item => 
        item.keywords.some(kw => lowerDesc.includes(kw))
    ) || {
        title: 'Custom Operational Checklist',
        checklistItems: [
            'Define objective for this task',
            'Identify key personnel involved',
            'Determine required materials and budget',
            'Establish timeline and milestones',
            'Define success criteria and reporting flow'
        ]
    };

    return {
        title: match.title,
        checklistItems: match.checklistItems
    };
}
