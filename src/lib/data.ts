import { StatCard, WeeklyActivity, RecentCheckout, PlanGoal, TeamMemberRole, SuccessMetric, CalendarEvent } from './types';
import { DollarSign, Users, Activity, Heart } from 'lucide-react';

export const statsCards: StatCard[] = [
  {
    title: 'Fundraising Progress',
    value: 'UGX 900K / 1.5M',
    change: '+20.1% from last month',
    icon: DollarSign,
  },
  {
    title: 'Volunteers Engaged',
    value: '+23',
    change: '+180.1% from last month',
    icon: Users,
  },
  {
    title: 'Activities Logged',
    value: '12',
    change: '+19% from last week',
    icon: Activity,
  },
  {
    title: 'Team Wellbeing',
    value: '4.2 / 5.0',
    change: '+0.2 from last week',
    icon: Heart,
  },
];

export const weeklyActivityData: WeeklyActivity[] = [
    { day: 'Mon', "Girl Child Day": 2, "Tree Planting": 1, "PTA Meeting": 0 },
    { day: 'Tue', "Girl Child Day": 3, "Tree Planting": 2, "PTA Meeting": 1 },
    { day: 'Wed', "Girl Child Day": 5, "Tree Planting": 1, "PTA Meeting": 1 },
    { day: 'Thu', "Girl Child Day": 1, "Tree Planting": 0, "PTA Meeting": 2 },
    { day: 'Fri', "Girl Child Day": 4, "Tree Planting": 3, "PTA Meeting": 1 },
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
    { member: "McMike (ED)", focus: "Strategic oversight & systems", deliverables: "Template creation, partnership protection, team wellbeing" },
    { member: "Purity (Programs)", focus: "Planning & partnerships", deliverables: "Weekly plans, PTA meetings, Dignity Pads development" },
    { member: "Grace (Operations)", focus: "Field execution & volunteers", deliverables: "Daily check-ins, tree planting, event logistics" },
    { member: "Alex (Media Lead)", focus: "Communications strategy", deliverables: "Newsletter coordination, content planning" },
    { member: "Jimmy (Media Officer)", focus: "Content production", deliverables: "Documentary, photography, video editing" },
    { member: "Fundraising Consultant", focus: "Resource mobilization", deliverables: "Donor engagement, proposal writing, campaign management" },
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
        date: new Date(2025, 9, 11),
        title: "Girl Child Day",
        description: "Flagship public event. Success: 150+ students, 300K raised."
    },
    {
        date: new Date(2025, 9, 15),
        title: "Fundraising Checkpoint",
        description: "Review progress towards 1.5M target. Should be at >60%."
    },
    {
        date: new Date(2025, 9, 26),
        title: "RED Campaign Documentary Premiere",
        description: "Internal premiere of the fundraising documentary."
    },
    {
        date: new Date(2025, 9, 31),
        title: "Fundraising Target Deadline",
        description: "Final day to meet the 1.5M fundraising goal for October."
    }
];
