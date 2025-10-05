import { StatCard, WeeklyActivity, RecentCheckout, PlanGoal, TeamMemberRole, SuccessMetric, CalendarEvent, Program, Partnership, Project, ImpactMetric, Alert } from './types';
import { Users, Activity, Briefcase, TrendingUp, HandCoins, Video } from 'lucide-react';
import { format } from 'date-fns';

export const statsCards: StatCard[] = [
  {
    title: 'Active Projects',
    value: '6',
    change: 'RED, GreenSchools, YoSkills...',
    icon: Briefcase,
  },
  {
    title: 'Youth Reached (Month)',
    value: '2,473',
    change: '+15% from last month',
    icon: Users,
  },
  {
    title: 'Schools Engaged',
    value: '15',
    change: '2 new schools this month',
    icon: Activity,
  },
  {
    title: 'Funds Spent (Oct)',
    value: '68%',
    change: 'UGX 1.35M / 2M',
    icon: HandCoins,
  },
  {
    title: 'New Media Uploads',
    value: '39',
    change: '12 posts, 3 videos',
    icon: Video,
  },
];

export const projects: Project[] = [
    {
        name: "RED Campaign",
        manager: "Dianah",
        districts: "Mpigi, Butambala",
        status: "Active",
        completion: 65,
        nextMilestone: "Launch RED Pads – Oct 11"
    },
    {
        name: "GreenSchools",
        manager: "Dianah",
        districts: "Mpigi",
        status: "Active",
        completion: 45,
        nextMilestone: "Tree Planting – Oct 15"
    },
    {
        name: "YoSkills Circles",
        manager: "Dianah",
        districts: "Mpigi",
        status: "Moderate",
        completion: 40,
        nextMilestone: "Graduation Prep – Nov 1"
    },
    {
        name: "Omuto Football Alliance",
        manager: "Kasirye",
        districts: "Mpigi, Butambala",
        status: "Active",
        completion: 70,
        nextMilestone: "Omuto Cup Finals – Dec 5"
    },
    {
        name: "Omuto Essentials",
        manager: "Alex",
        districts: "Mpigi",
        status: "Active",
        completion: 85,
        nextMilestone: "Launch Body Wash – Oct 20"
    },
    {
        name: "Omuto Pulse",
        manager: "Alex",
        districts: "Central Uganda",
        status: "Active",
        completion: 55,
        nextMilestone: "RED Campaign Feature – Oct 10"
    }
];

export const impactMetrics: ImpactMetric[] = [
    {
        metric: "Trees Planted",
        target: 700,
        current: 612,
        unit: ""
    },
    {
        metric: "Girls Supported (RED)",
        target: 600,
        current: 520,
        unit: ""
    },
    {
        metric: "Schools with PureWater",
        target: 5,
        current: 3,
        unit: ""
    },
    {
        metric: "YoSkills Graduates",
        target: 80,
        current: 52,
        unit: ""
    },
    {
        metric: "Youth in OFA",
        target: 200,
        current: 147,
        unit: ""
    }
];

export const tagColors: { [key: string]: string } = {
    '#FieldVisit': 'border-blue-500 bg-blue-500/10 text-blue-500',
    '#Media': 'border-purple-500 bg-purple-500/10 text-purple-500',
    '#Programs': 'border-green-500 bg-green-500/10 text-green-500',
    '#FieldWork': 'border-orange-500 bg-orange-500/10 text-orange-500',
    '#Approval': 'border-teal-500 bg-teal-500/10 text-teal-500',
    '#Finance': 'border-pink-500 bg-pink-500/10 text-pink-500',
    '#Update': 'border-gray-500 bg-gray-500/10 text-gray-500',
};


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
        date: new Date(2025, 9, 10),
        title: "Int'l Girl Child Day Celebration",
        description: "Event at Kammengo SS.",
        responsible: "Dianah",
        location: "Kammengo SS"
    },
    {
        date: new Date(2025, 9, 11),
        title: "RED Pads Launch",
        description: "Public launch of the RED Pads initiative.",
        responsible: "Dianah & Alex",
        location: "Mpigi Town"
    },
    {
        date: new Date(2025, 9, 15),
        title: "GreenSchools Tree Planting",
        description: "Community tree planting event.",
        responsible: "Kasirye",
        location: "Buwama"
    },
    {
        date: new Date(2025, 9, 20),
        title: "Watermelon Body Wash Launch",
        description: "Launch for Omuto Essentials product.",
        responsible: "Alex",
        location: "Omuto Essentials Outlet"
    },
    {
        date: new Date(2025, 9, 25),
        title: "Team Meeting & Reporting",
        description: "Weekly team sync and reporting.",
        responsible: "All",
        location: "Youth Centre"
    }
];


export const alerts: Alert[] = [
    {
        type: "Urgent",
        message: "YoSkills Circle Mpigi needs new materials – stock low.",
        priority: "High",
        action: "Notify Alex"
    },
    {
        type: "Reminder",
        message: "Butambala report overdue (Bwire).",
        priority: "Medium",
        action: "Ping Field"
    },
    {
        type: "Info",
        message: "RED Campaign coverage posted on Omuto Pulse.",
        priority: "Low",
        action: "View Post"
    }
];


export const programs: Program[] = [
  {
    title: "RED Campaign",
    description: "Rural Education Drive to provide resources and support to rural schools.",
    lead: "Dianah",
    status: "On Track",
    deadline: "Dec 2024",
    objectives: [
        "Distribute 10,000 textbooks",
        "Train 50 teachers on new curriculum",
        "Establish 5 new school libraries"
    ]
  },
  {
    title: "GreenSchools Initiative",
    description: "Promoting environmental conservation through school-based programs.",
    lead: "Kasirye",
    status: "On Track",
    deadline: "Ongoing",
    objectives: [
        "Plant 10,000 trees across 20 schools",
        "Establish 20 school gardening clubs",
        "Conduct 5 workshops on waste management"
    ]
  },
    {
    title: "YoSkills for Work",
    description: "Equipping youth with vocational and entrepreneurial skills.",
    lead: "Dianah",
    status: "At Risk",
    deadline: "Jan 2025",
    objectives: [
        "Train 200 youth in tailoring and hairdressing",
        "Provide startup kits to 50 graduates",
        "Secure 20 internship placements"
    ]
  },
    {
    title: "Dignity Plus",
    description: "A social enterprise for producing and distributing reusable sanitary pads.",
    lead: "Kasirye",
    status: "Delayed",
    deadline: "Mar 2025",
    objectives: [
        "Finalize pad prototype",
        "Set up a production unit",
        "Train 10 women in pad production"
    ]
  }
];

export const partnerships: Partnership[] = [
    {
        name: "Ministry of Education",
        contactPerson: "Jane Doe",
        contactEmail: "jane.doe@moe.gov.ug",
        status: "Active",
        nextStep: "Quarterly review meeting on Oct 20th"
    },
    {
        name: "EcoBank",
        contactPerson: "John Smith",
        contactEmail: "jsmith@ecobank.com",
        status: "Active",
        nextStep: "Follow up on GreenSchools sponsorship proposal"
    },
    {
        name: "UNICEF Uganda",
        contactPerson: "Alice Johnson",
        contactEmail: "ajohnson@unicef.org",
        status: "Potential",
        nextStep: "Send concept note for YoSkills partnership"
    },
     {
        name: "Rotary Club of Kampala",
        contactPerson: "Peter Jones",
        contactEmail: "pjones@rotary.org",
        status: "Inactive",
        nextStep: "Re-engage for potential collaboration in 2025"
    }
]
