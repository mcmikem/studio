'use server';

import { getFirebaseAdmin } from '@/firebase/server-only';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { format } from 'date-fns';
import { roleKpis } from '@/lib/data';
import { checkRateLimit } from '@/lib/rate-limit';
import type { AlertInput, GrantFinderInput, GrantFinderOutput, SmartRemindersInput, SmartRemindersOutput, DailyPlannerAIInput, DailyPlannerAIOutput, GenerateTemplateInput, GenerateTemplateOutput } from '@/lib/types';
import type { LeaveRequest, PayrollRecord } from '@/lib/types/hr';

async function rateLimitCheck(identifier: string, actionName: string) {
    const result = await checkRateLimit(identifier, 60000, 20);
    if (!result.allowed) {
        console.warn(`Rate limit exceeded for ${identifier} on ${actionName}`);
        return { allowed: false, error: 'Rate limit exceeded. Please try again later.' };
    }
    return { allowed: true };
}

export async function createAlertAction(input: AlertInput) {
    const rateLimit = await rateLimitCheck('createAlertAction', 'createAlertAction');
    if (!rateLimit.allowed) {
        return { success: false, error: rateLimit.error };
    }
    try {
        const { firestore } = getFirebaseAdmin();
        const alertPayload = {
            ...input,
            targetUserIds: input.targetUserIds || [],
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

export async function createTestimonyAction(data: Record<string, unknown>) {
    const rateLimit = await rateLimitCheck('createTestimonyAction', 'createTestimonyAction');
    if (!rateLimit.allowed) return { success: false, error: rateLimit.error };
    try {
        const { firestore } = getFirebaseAdmin();
        const { title, content, authorName, mediaType, mediaUrl, status } = data;
        const docRef = await firestore.collection('testimonies').add({
            title, content, authorName, mediaType, mediaUrl, status,
            createdAt: FieldValue.serverTimestamp()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        return { success: false, error: 'Failed to create the testimony record.' };
    }
}

export async function updateTestimonyAction(id: string, data: Record<string, unknown>) {
    const rateLimit = await rateLimitCheck('updateTestimonyAction', 'updateTestimonyAction');
    if (!rateLimit.allowed) return { success: false, error: rateLimit.error };
    try {
        const { firestore } = getFirebaseAdmin();
        const { title, content, authorName, mediaType, mediaUrl, status } = data;
        await firestore.collection('testimonies').doc(id).update({
            title, content, authorName, mediaType, mediaUrl, status,
            updatedAt: FieldValue.serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to update the testimony record.' };
    }
}

export async function deleteTestimonyAction(id: string) {
    const rateLimit = await rateLimitCheck('deleteTestimonyAction', 'deleteTestimonyAction');
    if (!rateLimit.allowed) return { success: false, error: rateLimit.error };
    try {
        const { firestore } = getFirebaseAdmin();
        await firestore.collection('testimonies').doc(id).delete();
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to delete the testimony record.' };
    }
}

export async function createBeneficiaryAction(data: Record<string, unknown>) {
    const rateLimit = await rateLimitCheck('createBeneficiaryAction', 'createBeneficiaryAction');
    if (!rateLimit.allowed) return { success: false, error: rateLimit.error };
    try {
        const { firestore } = getFirebaseAdmin();
        const { name, dateOfBirth, gender, school, program, guardianName, guardianPhone, location } = data;
        const docRef = await firestore.collection('beneficiaries').add({
            name, dateOfBirth, gender, school, program, guardianName, guardianPhone, location,
            createdAt: FieldValue.serverTimestamp()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        return { success: false, error: 'Failed to register beneficiary.' };
    }
}

export async function updateBeneficiaryAction(id: string, data: Record<string, unknown>) {
    const rateLimit = await rateLimitCheck('updateBeneficiaryAction', 'updateBeneficiaryAction');
    if (!rateLimit.allowed) return { success: false, error: rateLimit.error };
    try {
        const { firestore } = getFirebaseAdmin();
        const { name, dateOfBirth, gender, school, program, guardianName, guardianPhone, location } = data;
        await firestore.collection('beneficiaries').doc(id).update({
            name, dateOfBirth, gender, school, program, guardianName, guardianPhone, location,
            updatedAt: FieldValue.serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to update beneficiary record.' };
    }
}

export async function deleteBeneficiaryAction(id: string) {
    const rateLimit = await rateLimitCheck('deleteBeneficiaryAction', 'deleteBeneficiaryAction');
    if (!rateLimit.allowed) return { success: false, error: rateLimit.error };
    try {
        const { firestore } = getFirebaseAdmin();
        await firestore.collection('beneficiaries').doc(id).delete();
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to delete beneficiary record.' };
    }
}

export async function createAttendanceAction(data: Record<string, unknown>) {
    const rateLimit = await rateLimitCheck('createAttendanceAction', 'createAttendanceAction');
    if (!rateLimit.allowed) return { success: false, error: rateLimit.error };
    try {
        const { firestore } = getFirebaseAdmin();
        const { userId, userName, date, status: attendanceStatus, program, notes } = data;
        const docRef = await firestore.collection('attendance-records').add({
            userId, userName, date, status: attendanceStatus, program, notes,
            createdAt: FieldValue.serverTimestamp()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        return { success: false, error: 'Failed to record attendance.' };
    }
}

export async function updateAttendanceAction(id: string, data: Record<string, unknown>) {
    const rateLimit = await rateLimitCheck('updateAttendanceAction', 'updateAttendanceAction');
    if (!rateLimit.allowed) return { success: false, error: rateLimit.error };
    try {
        const { firestore } = getFirebaseAdmin();
        const { status: attendanceStatus, notes } = data;
        await firestore.collection('attendance-records').doc(id).update({
            status: attendanceStatus, notes,
            updatedAt: FieldValue.serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to update attendance record.' };
    }
}

export async function deleteAttendanceAction(id: string) {
    const rateLimit = await rateLimitCheck('deleteAttendanceAction', 'deleteAttendanceAction');
    if (!rateLimit.allowed) return { success: false, error: rateLimit.error };
    try {
        const { firestore } = getFirebaseAdmin();
        await firestore.collection('attendance-records').doc(id).delete();
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to delete attendance record.' };
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
            workingStartTime: input.workingStartTime,
            workingEndTime: input.workingEndTime,
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

export async function getEnterpriseInsightsAction(input: { sales: any[]; inventory: any[]; production: any[] }) {
  const { getEnterpriseInsights } = await import('@/ai/flows/enterprise-advisor-flow');
  return await getEnterpriseInsights(input);
}

// ─── HR & Self-Service Actions ───

export async function createLeaveRequestAction(data: Omit<LeaveRequest, 'id' | 'createdAt'>) {
    const rateLimit = await rateLimitCheck('createLeaveRequestAction', 'createLeaveRequestAction');
    if (!rateLimit.allowed) return { success: false, error: rateLimit.error };
    try {
        const { firestore } = getFirebaseAdmin();
        const docRef = await firestore.collection('leave-requests').add({
            ...data,
            createdAt: FieldValue.serverTimestamp(),
            startDate: Timestamp.fromDate(new Date(data.startDate)),
            endDate: Timestamp.fromDate(new Date(data.endDate)),
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        return { success: false, error: 'Failed to submit leave request.' };
    }
}

export async function updateLeaveStatusAction(id: string, status: string, adminId: string, adminName: string, rejectionReason?: string) {
    const rateLimit = await rateLimitCheck('updateLeaveStatusAction', 'updateLeaveStatusAction');
    if (!rateLimit.allowed) return { success: false, error: rateLimit.error };
    try {
        const { firestore } = getFirebaseAdmin();
        await firestore.collection('leave-requests').doc(id).update({
            status,
            approvedBy: adminId,
            approvedByName: adminName,
            rejectionReason: rejectionReason || null,
            updatedAt: FieldValue.serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to update leave status.' };
    }
}

export async function createPayrollRecordAction(data: Omit<PayrollRecord, 'id' | 'createdAt'>) {
    const rateLimit = await rateLimitCheck('createPayrollRecordAction', 'createPayrollRecordAction');
    if (!rateLimit.allowed) return { success: false, error: rateLimit.error };
    try {
        const { firestore } = getFirebaseAdmin();
        const docRef = await firestore.collection('payroll').add({
            ...data,
            createdAt: FieldValue.serverTimestamp()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        return { success: false, error: 'Failed to create payroll record.' };
    }
}

// ─── System Utilities ───

export async function createSystemAlert(input: { type: string; title: string; message: string; userId?: string; link?: string }) {
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
        console.error('Server Action Error - createSystemAlert:', error);
        return { success: false };
    }
}

