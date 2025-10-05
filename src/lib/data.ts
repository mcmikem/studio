import { PlanGoal, TeamMemberRole, SuccessMetric, CalendarEvent, StatCard } from './types';

export const tagColors: { [key: string]: string } = {
    '#FieldVisit': 'border-blue-500 bg-blue-500/10 text-blue-500',
    '#Media': 'border-purple-500 bg-purple-500/10 text-purple-500',
    '#Programs': 'border-green-500 bg-green-500/10 text-green-500',
    '#FieldWork': 'border-orange-500 bg-orange-500/10 text-orange-500',
    '#Approval': 'border-teal-500 bg-teal-500/10 text-teal-500',
    '#Finance': 'border-pink-500 bg-pink-500/10 text-pink-500',
    '#Update': 'border-gray-500 bg-gray-500/10 text-gray-500',
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

export const teamRoles: TeamMemberRole[] = [
    { member: "McMike Mutumba (ED)", focus: "Strategic oversight & systems", deliverables: "Template creation, partnership protection, team wellbeing" },
    { member: "Nansikombi Dianah (Programs)", focus: "Planning & partnerships", deliverables: "Weekly plans, PTA meetings, Dignity Pads development" },
    { member: "Kasirye Constantine (Operations)", focus: "Field execution & volunteers", deliverables: "Daily check-ins, tree planting, event logistics" },
    { member: "Alex (Media Lead)", focus: "Communications strategy", deliverables: "Newsletter coordination, content planning" },
    { member: "Jimmy (Media Officer)", focus: "Content production", deliverables: "Documentary, photography, video editing" },
    { member: "Bwire Bashir (Field Coordinator)", focus: "Resource mobilization", deliverables: "Donor engagement, proposal writing, campaign management" },
];

export const successMetrics: SuccessMetric[] = [
    {
        metric: "Fundraising",
        green: ">60% by Oct 15",
        yellow: "40-60% by Oct 15",
        red: "<40% by Oct 15",
        response: "Emergency strategy session"
    },
    {
        metric: "Team Wellbeing",
        green: "4.0+ rating",
        yellow: "3.0-3.9 rating",
        red: "<3.0 for 2 weeks",
        response: "Individual check-ins, reduce workload"
    },
    {
        metric: "Goal Progress",
        green: ">80% on track",
        yellow: "50-80% on track",
        red: "<50% by Oct 20",
        response: "Reallocate resources, adjust goals"
    }
];

export const operationalPlanEvents: CalendarEvent[] = [
    {
        date: new Date(2025, 9, 6),
        title: "RED Campaign Planning Mtg",
        description: "Planning session for the RED campaign.",
        responsible: "Dianah & Team",
        location: "Youth Centre",
        category: "Campaigns/Events"
    },
    {
        date: new Date(2025, 9, 7),
        title: "Omuto Pulse Filming",
        description: "Filming for Omuto Pulse.",
        responsible: "Alex & Jimmy",
        location: "On location",
        category: "Team Meetings"
    },
    {
        date: new Date(2025, 9, 8),
        title: "Butambala Field Visit",
        description: "Field visit to Butambala.",
        responsible: "Bwire & Kasirye",
        location: "Butambala",
        category: "Field Visits"
    },
    {
        date: new Date(2025, 9, 10),
        title: "World Mental Health Day",
        description: "Internal activity suggestion.",
        responsible: "All",
        location: "Youth Centre",
        category: "Social Days"
    },
    {
        date: new Date(2025, 9, 9),
        title: "International Day of the Girl Child",
        description: "International Day of the Girl Child. A key day for our RED Campaign.",
        responsible: "All",
        location: "Global",
        category: "Social Days"
    },
     {
        date: new Date(2025, 9, 10),
        title: "RED Pads Launch Event",
        description: "Launch event for RED Pads in Mpigi Town.",
        responsible: "All Staff",
        location: "Mpigi Town",
        category: "Campaigns/Events"
    },
];
