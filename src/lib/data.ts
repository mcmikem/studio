

import { PlanGoal, TeamMemberRole, SuccessMetric, CalendarEvent, StatCard, KeyResult, User, Program, Partnership, Project, ImpactMetric, Alert, TeamWeeklyPlan, Expense, Income } from './types';
import { AlertTriangle, Info } from 'lucide-react';
import { startOfWeek, setDate } from 'date-fns';
import { Timestamp } from 'firebase/firestore';


export const KNOWLEDGE_BASE = `You are an expert AI assistant for the Omuto Foundation, a youth-led nonprofit in Mpigi, Uganda. Your role is to provide accurate, helpful, and concise information to team members, acting as a professional guide for planning, reporting, data analysis, and M&E. You must ensure all guidance aligns with Omuto's operational standards and philosophy.

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
- "KR5 (Football Gala)": Complete framework (venue, budget, etc.) by Oct 28.
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


export const tagColors: { [key: string]: string } = {
    '#FieldVisit': 'border-blue-500 bg-blue-500/10 text-blue-500',
    '#Media': 'border-purple-500 bg-purple-500/10 text-purple-500',
    '#Programs': 'border-green-500 bg-green-500/10 text-green-500',
    '#FieldWork': 'border-orange-500 bg-orange-500/10 text-orange-500',
    '#Approval': 'border-teal-500 bg-teal-500/10 text-teal-500',
    '#Finance': 'border-pink-500 bg-pink-500/10 text-pink-500',
    '#Update': 'border-gray-500 bg-gray-500/10 text-gray-500',
    '#Fundraising': 'border-red-500 bg-red-500/10 text-red-500',
    '#Partnerships': 'border-indigo-500 bg-indigo-500/10 text-indigo-500',
};

export const quickStats: Omit<StatCard, 'icon'>[] = [
    { title: 'Active Schools', value: '12' },
    { title: 'Students Engaged', value: '1,250' },
    { title: 'Projects Running', value: '3' },
    { title: 'Events this Month', value: '6' },
    { title: 'Funds Raised (Cycle of Dignity)', value: 'UGX 1.2M / 2M', change: '60% of target' },
    { title: 'New Media Uploads', value: '5 stories' },
];

export const nonNegotiableGoals: PlanGoal[] = [
    {
        title: "Girl Child Day (Oct 11)",
        description: "Our flagship public event that builds visibility, recruits future leaders, and raises crucial funds.",
        details: "Success: 150+ students engaged, 300K raised, campus ambassadors recruited."
    },
    {
        title: "Fundraising Target (1.5M by Oct 31)",
        description: "Resources that enable everything else we do.",
        details: "Success: 60% from new donors, clear pipeline for November."
    },
    {
        title: "RED Campaign Documentary (Oct 26)",
        description: "Professional storytelling that drives future fundraising and awareness.",
        details: "Success: High-quality video used in donor meetings and social media."
    },
];

export const flexibleTargets: PlanGoal[] = [
    { title: "PTA Meetings (3 schools)", description: "Build relationships and gather feedback.", details: "" },
    { title: "Tree Planting (510 trees with 85% survival)", description: "Environmental impact and community engagement.", details: "" },
    { title: "Dignity Pads (5 prototype types)", description: "Develop our social enterprise.", details: "" },
    { title: "Newsletter (2 Sunday editions)", description: "Keep our community informed and engaged.", details: "" },
];

export const sampleUsers: Omit<User, 'id'>[] = [
    { name: 'McMike Mutumba', email: 'mcmike@omuto.org', role: 'Executive Director' },
    { name: 'Dianah Nansikombi', email: 'programs@omuto.org', role: 'Programs & Partnerships Manager' },
    { name: 'Kasirye Constantine', email: 'operations@omuto.org', role: 'Operations & Field Manager' },
    { name: 'Nsereko Alex', email: 'alex@omuto.org', role: 'Media & Finance Lead' },
    { name: 'Bwire Bashir', email: 'bashir@omuto.org', role: 'Field Coordinator' },
    { name: 'John Paul Akera', email: 'akera@omuto.org', role: 'Resource Mobilization Lead' },
    { name: 'Omuto General', email: 'info@omuto.org', role: 'Administrator' },
];

export const samplePrograms: Omit<Program, 'id' | 'createdAt'>[] = [
    { title: 'RED Campaign', description: 'Menstrual Health Management education and support.', lead: 'Dianah Nansikombi', status: 'On Track', deadline: '2025-12-31', objectives: ['Deliver sessions to 200 parents and 50 teachers', 'Reach 600 girls with MHM kits'], valuePerObjective: 50000 },
    { title: 'GreenSchools Campaign', description: 'Environmental conservation through school-based activities.', lead: 'Kasirye Constantine', status: 'At Risk', deadline: '2025-11-30', objectives: ['Plant 700 trees', 'Establish 10 student Green Teams'], valuePerObjective: 20000 },
    { title: 'YoSkills Entrepreneurship', description: 'Vocational and business training for youth.', lead: 'Dianah Nansikombi', status: 'On Track', deadline: '2026-01-31', objectives: ['Train 50 youth in soap-making', 'Launch 5 new youth-led enterprises'], valuePerObjective: 75000 },
];

export const samplePartnerships: Omit<Partnership, 'id' | 'createdAt'>[] = [
    { name: 'Spouts of Water', contactPerson: 'Daniel Yin', contactEmail: 'daniel@spouts.org', status: 'Active', nextStep: 'Co-design PureWater Initiative Phase 2' },
    { name: 'MHAMIA Foundation', contactPerson: 'Sarah Nakka', contactEmail: 'sarah.n@mhamia.org', status: 'Active', nextStep: 'Joint training session at Mpigi Secondary' },
    { name: 'Mpigi District Local Government', contactPerson: 'Mr. Bwekembe', contactEmail: 'cao.mpigi@lg.go.ug', status: 'Active', nextStep: 'Align on Q4 youth programs' },
    { name: 'GlobalGiving', contactPerson: 'Regional Manager', contactEmail: 'africa@globalgiving.org', status: 'Potential', nextStep: 'Submit final report for Cycle of Dignity' },
];

export const sampleProjects: Omit<Project, 'id' | 'createdAt'>[] = [
    { name: 'RED Campaign School Tour (Mpigi)', manager: 'Dianah Nansikombi', districts: 'Mpigi', status: 'Active', completion: 65, nextMilestone: 'Sign MoU with Nindye SS' },
    { name: 'GreenSchools Butambala Launch', manager: 'Bwire Bashir', districts: 'Butambala', status: 'Active', completion: 20, nextMilestone: 'Recruit 5 volunteer facilitators' },
];

export const sampleImpactMetrics: Omit<ImpactMetric, 'id'>[] = [
    { metric: 'Girls Supported (RED)', target: 600, current: 520, unit: 'girls', valuePerUnit: 25000 },
    { metric: 'Trees Planted (GreenSchools)', target: 700, current: 190, unit: 'trees', valuePerUnit: 5000 },
    { metric: 'Cycle of Dignity Fundraising', target: 2000000, current: 800000, unit: 'UGX', valuePerUnit: 1 },
    { metric: 'Youth Reached', target: 1000, current: 247, unit: 'youth', valuePerUnit: 10000 },
];

export const sampleAlerts: Omit<Alert, 'id' | 'createdAt'>[] = [];

export const sampleCalendarEvents: Omit<CalendarEvent, 'id' | 'createdAt'>[] = [];


export const sampleKeyResults: Omit<KeyResult, 'id'>[] = [
    {
        title: 'OCT-KR1',
        description: 'Increase Cycle of Dignity funding',
        currentProgress: 800000,
        target: 2000000,
        deadline: '2025-10-31',
        priority: 'High',
    },
    {
        title: 'OCT-KR2',
        description: 'Plant remaining 510 trees',
        currentProgress: 0,
        target: 510,
        deadline: '2025-10-25',
        priority: 'High',
    },
     {
        title: 'OCT-KR3',
        description: 'Deliver RED Campaign sessions to parents/teachers',
        currentProgress: 0,
        target: 250,
        deadline: '2025-10-31',
        priority: 'High',
    },
    {
        title: 'OCT-KR4',
        description: 'Secure new partnership commitments',
        currentProgress: 0,
        target: 6,
        deadline: '2025-10-31',
        priority: 'Medium',
    },
    {
        title: 'OCT-KR5',
        description: 'Finalize Football Gala framework',
        currentProgress: 25,
        target: 100,
        deadline: '2025-10-28',
        priority: 'Medium',
    },
    {
        title: 'OCT-KR6',
        description: 'Standardize YAP Chapter SOPs',
        currentProgress: 10,
        target: 100,
        deadline: '2025-10-25',
        priority: 'Low',
    },
     {
        title: 'OCT-KR7',
        description: 'Implement digital field tracking system',
        currentProgress: 50,
        target: 100,
        deadline: '2025-10-31',
        priority: 'Medium',
    },
    {
        title: 'OCT-KR8',
        description: 'Develop 10 Dignity Pad prototypes',
        currentProgress: 0,
        target: 10,
        deadline: '2025-10-21',
        priority: 'High',
    },
];


export const sampleTeamWeeklyPlans: Omit<TeamWeeklyPlan, 'id' | 'createdAt'>[] = [
  {
    weekOf: Timestamp.fromDate(startOfWeek(new Date('2025-10-13T12:00:00Z'), { weekStartsOn: 1 })),
    keyPriorities: [
      { activity: 'Submission of permit renewal files to NGO Bureau office', priority: 'High', responsible: ['Dianah Nansikombi'], deadline: '' },
      { activity: 'Host an orientation session about how to use Omuto Central.', priority: 'High', responsible: ['McMike Mutumba'], deadline: '' },
      { activity: 'Increase mobilization of funds for Cycle of Dignity Campaign', priority: 'High', responsible: ['All Members'], deadline: '' },
      { activity: 'Secure 3 PTA schools meeting for awareness of Red campaign', priority: 'Medium', responsible: ['Dianah Nansikombi'], deadline: '' },
      { activity: 'Secure 3 partnership meetings for programs support', priority: 'Medium', responsible: ['Dianah Nansikombi', 'Kasirye Constantine'], deadline: '' },
      { activity: 'Drafting new YAP Chapters SOPs', priority: 'Low', responsible: ['Dianah Nansikombi'], deadline: '' },
      { activity: 'Shoot a documentary for Red Campaign to be used for partnerships', priority: 'High', responsible: ['Nsereko Alex'], deadline: '' },
      { activity: 'Produce first prototype batch of 10 of Dignity pads.', priority: 'High', responsible: ['Kasirye Constantine'], deadline: '' },
      { activity: 'Complete field mapping for Mpigi,Butambala and Kampala', priority: 'Medium', responsible: ['Kasirye Constantine', 'Dianah Nansikombi'], deadline: '' },
      { activity: 'Schedule a stake holder consultation meeting for Omuto Football Gala', priority: 'Low', responsible: ['Kasirye Constantine'], deadline: '' },
      { activity: 'Draft 3 compelling stories about Menstrual Health management and Cycle of dignity campaign', priority: 'Medium', responsible: ['Nsereko Alex'], deadline: '' },
      { activity: 'Hold a weekly review meeting(goals vs achievements)', priority: 'High', responsible: ['All Members'], deadline: '' },
      { activity: 'Draft a detailed weekly report.', priority: 'Medium', responsible: ['Dianah Nansikombi'], deadline: '' },
      { activity: 'Draft a concept note for Omuto Football Gala', priority: 'Low', responsible: ['Dianah Nansikombi'], deadline: '' }
    ],
    message: 'This week, our focus is on executing these key priorities to advance our Q4 objectives. Let\'s ensure we are aligned, communicative, and supportive of each other to achieve these goals.',
    authorId: 'system-seed',
    authorName: 'Dianah Nansikombi',
    status: 'Published',
  }
];


export const sampleHistoricalIncome: Omit<Income, 'id' | 'createdAt'>[] = [
    { source: 'Member Donations', amount: 2552000, dateReceived: '2025-01-15', type: 'Member Donations' },
    { source: 'Member Donations', amount: 3003000, dateReceived: '2025-02-15', type: 'Member Donations' },
    { source: 'Member Donations', amount: 3139853, dateReceived: '2025-03-15', type: 'Member Donations' },
    { source: 'Member Donations', amount: 4687392, dateReceived: '2025-04-15', type: 'Member Donations' },
    { source: 'Member Donations', amount: 2878799, dateReceived: '2025-05-15', type: 'Member Donations' },
    { source: 'Member Donations', amount: 525550, dateReceived: '2025-06-15', type: 'Member Donations' },
    { source: 'Member Donations', amount: 2121448, dateReceived: '2025-07-15', type: 'Member Donations' },
    { source: 'Partnerships', amount: 945500, dateReceived: '2025-07-20', type: 'Partnerships' },
    { source: 'Imac Enterprises', amount: 140000, dateReceived: '2025-07-25', type: 'Imac Enterprises' },
    { source: 'Member Donations', amount: 504080, dateReceived: '2025-08-15', type: 'Member Donations' },
    { source: 'Imac Enterprises', amount: 70000, dateReceived: '2025-08-25', type: 'Imac Enterprises' },
    { source: 'Member Donations', amount: 505734, dateReceived: '2025-09-15', type: 'Member Donations' },
    { source: 'Member Donations', amount: 509855, dateReceived: '2025-10-15', type: 'Member Donations' },
];

export const sampleHistoricalExpenses: Omit<Expense, 'id' | 'createdAt'>[] = [
  { userId: 'system', userName: 'System Seed', date: '2025-01-20', title: 'Office Setup', type: 'Reimbursement', items: [{ description: 'Office Rent Q1', category: 'Rent', amount: 750000 }, { description: 'Internet Installation', category: 'Office Dev\'t', amount: 150000 }], totalAmount: 900000, status: 'Acknowledged' },
  { userId: 'system', userName: 'System Seed', date: '2025-02-10', title: 'RED Campaign Launch', type: 'Requisition', items: [{ description: 'Transport to schools', category: 'Transport', amount: 200000 }, { description: 'Printing awareness materials', category: 'Printing & Photocopy', amount: 120000 }], totalAmount: 320000, status: 'Acknowledged' },
  { userId: 'system', userName: 'System Seed', date: '2025-03-05', title: 'Monthly Staff Stipends', type: 'Requisition', items: [{ description: 'February Stipends', category: 'Allowances and stipends', amount: 1800000 }], totalAmount: 1800000, status: 'Acknowledged' },
  { userId: 'system', userName: 'System Seed', date: '2025-04-18', title: 'GreenSchools Kickoff', type: 'Requisition', items: [{ description: 'Purchase of 200 seedlings', category: 'Projects', amount: 300000 }, { description: 'Fuel for project vehicle', category: 'Fuel', amount: 100000 }], totalAmount: 400000, status: 'Acknowledged' },
  { userId: 'system', userName: 'System Seed', date: '2025-05-25', title: 'Partner Meeting - UNICEF', type: 'Reimbursement', items: [{ description: 'Meeting refreshments', category: 'Meetings', amount: 80000 }], totalAmount: 80000, status: 'Acknowledged' },
  { userId: 'system', userName: 'System Seed', date: '2025-06-15', title: 'Office Supplies', type: 'Requisition', items: [{ description: 'Stationery and consumables', category: 'Stationery', amount: 250000 }], totalAmount: 250000, status: 'Acknowledged' },
  { userId: 'system', userName: 'System Seed', date: '2025-07-30', title: 'Imac Enterprises Materials', type: 'Requisition', items: [{ description: 'Raw materials for soap production', category: 'IGA Expense', amount: 100000 }], totalAmount: 100000, status: 'Acknowledged' },
  { userId: 'system', userName: 'System Seed', date: '2025-08-20', title: 'Butambala Field Visit', type: 'Reimbursement', items: [{ description: 'Transport for field coordinator', category: 'Transport', amount: 150000 }], totalAmount: 150000, status: 'Acknowledged' },
  { userId: 'system', userName: 'System Seed', date: '2025-09-10', title: 'Media Team Content Day', type: 'Requisition', items: [{ description: 'Fuel and subject facilitation', category: 'Media', amount: 200000 }], totalAmount: 200000, status: 'Acknowledged' },
];
    

    






    