'use server';

import { getFirebaseAdmin } from '@/firebase/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { format } from 'date-fns';
import { roleKpis } from '@/lib/data';
import { checkRateLimit } from '@/lib/rate-limit';
import type { AlertInput, GrantFinderInput, GrantFinderOutput, SmartRemindersInput, SmartRemindersOutput, DailyPlannerAIInput, DailyPlannerAIOutput, GenerateTemplateInput, GenerateTemplateOutput } from '@/lib/types';

function rateLimitCheck(identifier: string, actionName: string) {
    const result = checkRateLimit(identifier, { windowMs: 60000, maxRequests: 20 });
    if (!result.allowed) {
        console.warn(`Rate limit exceeded for ${identifier} on ${actionName}`);
        return { allowed: false, error: 'Rate limit exceeded. Please try again later.' };
    }
    return { allowed: true };
}

export async function createAlertAction(input: AlertInput) {
    const rateLimit = rateLimitCheck('createAlertAction', 'createAlertAction');
    if (!rateLimit.allowed) {
        return { success: false, error: rateLimit.error };
    }
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

// ─── Smart Reminders (deterministic rule engine — data-aware) ───

export async function generateSmartRemindersAction(input: SmartRemindersInput): Promise<SmartRemindersOutput> {
    try {
        const { firestore } = getFirebaseAdmin();
        const { userId, userName, userRole } = input;

        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(today.getDate() + 7);
        const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const reminders: string[] = [];

        // 1. Check if user has checked in today
        const checkinSnapshot = await firestore.collection('checkins')
            .where('userId', '==', userId)
            .where('timestamp', '>=', Timestamp.fromDate(todayStart))
            .limit(1)
            .get();
        if (checkinSnapshot.empty) {
            reminders.push(`⚠️ You haven't checked in today. Head to Daily Planner to start your day!`);
        } else {
            reminders.push(`✅ Checked in! Great start, ${userName}.`);
        }

        // 2. Upcoming events (next 7 days)
        const eventsSnapshot = await firestore.collection('events')
            .where('date', '>=', Timestamp.fromDate(today))
            .where('date', '<=', Timestamp.fromDate(sevenDaysFromNow))
            .orderBy('date', 'asc')
            .limit(2)
            .get();
        if (!eventsSnapshot.empty) {
            eventsSnapshot.docs.forEach(doc => {
                const ev = doc.data();
                const dateStr = format(ev.date.toDate(), 'eeee, MMM d');
                reminders.push(`📅 Upcoming: "${ev.title}" on ${dateStr}.`);
            });
        }

        // 3. Pending tasks
        const tasksSnapshot = await firestore.collection('users').doc(userId).collection('tasks')
            .where('completed', '==', false)
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();
        if (!tasksSnapshot.empty) {
            const count = tasksSnapshot.size;
            const topTask = tasksSnapshot.docs[0].data().title;
            reminders.push(`📝 You have ${count} pending task${count > 1 ? 's' : ''}. Top priority: "${topTask}".`);
        } else {
            reminders.push(`🎉 All tasks complete! Great discipline, ${userName}.`);
        }

        // 4. Monthly expense submission check (for staff roles)
        const isStaff = !['Intern', 'Volunteer'].includes(userRole);
        if (isStaff) {
            const expensesSnapshot = await firestore.collection('expenses')
                .where('userId', '==', userId)
                .where('timestamp', '>=', Timestamp.fromDate(firstOfMonth))
                .limit(1)
                .get();
            if (expensesSnapshot.empty) {
                reminders.push(`💰 No expense report submitted this month. Don't forget to log your expenses!`);
            }
        }

        // 5. Strategic Alignment (Role-based KPI nudge)
        const kpis = roleKpis[userRole] || [];
        if (kpis.length > 0) {
            const randomKpi = kpis[Math.floor(Math.random() * kpis.length)];
            reminders.push(`💡 Today's Focus: ${randomKpi.title} — ${randomKpi.description}`);
        }

        return { reminders };
    } catch (error) {
        console.error('Server Action Error - generateSmartRemindersAction:', error);
        return { reminders: ['Could not load reminders at this time. Please check your connection.'] };
    }
}

// ─── Daily Planner (Hybrid: AI when online, algorithm offline) ───

export async function generateDailyPlanAction(input: DailyPlannerAIInput): Promise<DailyPlannerAIOutput> {
    // Try AI first, fall back to offline algorithm
    try {
        const { generateDailyPlan } = await import('@/ai/flows/daily-planner-flow');
        const aiPlan = await generateDailyPlan({
            userName: input.userName,
            userRole: input.userRole,
            primaryMission: input.primaryMission,
            weeklyPriorities: input.weeklyPriorities,
            keyResults: input.keyResults,
        });
        return aiPlan;
    } catch (error) {
        console.warn('AI planner unavailable, using offline algorithm:', error);
        // Fall back to offline algorithm
        const { generateOfflinePlan } = await import('@/ai/flows/daily-planner-flow');
        return generateOfflinePlan({ primaryMission: input.primaryMission, keyResults: input.keyResults });
    }
}

// ─── SOP Template Generator (Hybrid: AI when online, algorithm offline) ───

export async function generateTemplateAction(input: GenerateTemplateInput): Promise<GenerateTemplateOutput> {
    // Try AI first, fall back to offline algorithm
    try {
        const { templateGeneratorFlow } = await import('@/ai/flows/template-generator-flow');
        return await templateGeneratorFlow(input);
    } catch (error) {
        console.warn('AI template generator unavailable, using offline algorithm:', error);
        const { generateOfflineTemplate } = await import('@/ai/flows/template-generator-flow');
        return generateOfflineTemplate(input);
    }
}
