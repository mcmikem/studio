import { PlanGoal, TeamMemberRole, SuccessMetric, CalendarEvent, StatCard, KeyResult, User, Program, Partnership, Project, ImpactMetric, Alert } from './types';

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
    { name: 'Nsereko Alex', email: 'communications@omuto.org', role: 'Media & Communications Lead' },
    { name: 'Bwire Bashir', email: 'bashir@omuto.org', role: 'Field Coordinator' },
    { name: 'John Paul Akera', email: 'partnerships@omuto.org', role: 'Resource Mobilization Lead' },
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
    { metric: 'Trees Planted (GreenSchools)', target: 700, current: 510, unit: 'trees', valuePerUnit: 5000 },
    { metric: 'Cycle of Dignity Fundraising', target: 2000000, current: 800000, unit: 'UGX', valuePerUnit: 1 },
];

export const sampleAlerts: Omit<Alert, 'id' | 'createdAt'>[] = [
    { type: 'Urgent', message: 'Final report for GlobalGiving grant is due in 3 days.', priority: 'High', action: '/reports' },
    { type: 'Reminder', message: 'Team meeting tomorrow at 10 AM to discuss Girl Child Day.', priority: 'Medium', action: '/plan' },
];

export const sampleCalendarEvents: Omit<CalendarEvent, 'id' | 'createdAt'>[] = [
    { title: 'Girl Child Day Event', date: new Date('2025-10-11T09:00:00'), category: 'Campaigns/Events', location: 'Mpigi Town Square', responsible: 'Whole Team' },
    { title: 'Finalize RED Campaign Documentary', date: new Date('2025-10-26T17:00:00'), category: 'Deadlines', location: 'Office', responsible: 'Alex Nsereko' },
];


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
