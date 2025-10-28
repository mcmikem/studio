

import type { Timestamp } from 'firebase/firestore';
import { z } from 'zod';

export type StatCard = {
  title: string;
  value: string;
  change?: string;
  icon: React.ElementType;
};

export type WeeklyActivity = {
  day: string;
  'Girl Child Day': number;
  'Tree Planting': number;
  'PTA Meeting': number;
};

export type RecentCheckout = {
  id?: string;
  name: string;
  role: string;
  avatar: string;
  task: string;
  time?: string;
  timestamp?: Timestamp;
};

export type Checkin = {
  id: string;
  userId: string;
  name: string;
  primaryMission: string;
  details: DailyPlannerAIOutput;
  timestamp: Timestamp;
};

export type Checkout = {
  id?: string;
  name: string;
  role: string;
  avatar: string;
  task: string;
  time?: string;
  timestamp?: Timestamp;
  learning?: string;
  tomorrowPlan?: string;
  userId: string;
}

export type PlanGoal = {
  title: string;
  description: string;
  details: string;
};

export type TeamMemberRole = {
  member: string;
  focus: string;
  deliverables: string;
};

export type SuccessMetric = {
  metric: string;
  green: string;
  yellow: string;
  red: string;
  response: string;
};

export type CalendarEvent = {
    id: string;
    date: Timestamp;
    title: string;
    description?: string;
    responsible: string;
    location: string;
    category: "Team Meetings" | "Field Visits" | "Campaigns/Events" | "Deadlines" | "Social Days";
    createdAt?: Timestamp;
};

export type Program = {
    id: string;
    title: string;
    description: string;
    lead: string;
    status: "On Track" | "At Risk" | "Delayed" | "Completed";
    deadline: string;
    objectives: string[];
    valuePerObjective?: number;
    createdAt?: Timestamp;
}

export const PartnershipSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["NGO", "Government", "Corporate", "Individual"]),
  focusAreas: z.array(z.string()).optional(),
  contactPerson: z.string(),
  contactRole: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email(),
  offers: z.array(z.string()).optional(),
  receives: z.array(z.string()).optional(),
  financialValue: z.number().optional(),
  inKindValue: z.string().optional(),
  strategicValue: z.string().optional(),
  strategicFit: z.number().optional(),
  resourcePotential: z.enum(["High", "Medium", "Low"]).optional(),
  riskLevel: z.enum(["High", "Medium", "Low"]).optional(),
  priority: z.enum(["Immediate", "Short-term", "Long-term"]).optional(),
  status: z.enum(["Prospecting", "Negotiation", "Active", "Stalled"]),
  health: z.enum(["Strong", "Needs Attention", "At Risk"]).optional(),
  nextStep: z.string(),
  createdAt: z.any(), // Allow any for schema validation, will be Timestamp
  lastContacted: z.any(), // Allow any for schema validation, will be Timestamp
});
export type Partnership = z.infer<typeof PartnershipSchema>;


export type Activity = {
    id: string;
    title: string;
    userId: string;
    userName: string;
    actualCost: number;
    totalValue: number;
    finalRoi: number;
    loggedAt: Timestamp;
    primaryGoalType?: 'Metric' | 'Program';
    primaryGoalId?: string;
    primaryGoalQuantity?: number;
    indirectValue?: number;
    trees_planted?: number;
    parents_attended?: number;
    teachers_attended?: number;
    memorableMoment?: string;
    challengesLearned?: string;
    beneficiaryQuote?: string;
    ecosystem_phase?: "Identify & Inspire" | "Equip & Empower" | "Activate & Sustain";
};

export type Project = {
    id: string;
    name: string;
    manager: string;
    districts: string;
    status: "Active" | "Moderate" | "At Risk" | "Delayed";
    completion: number;
    nextMilestone: string;
    createdAt?: Timestamp;
}

export type ImpactMetric = {
    id: string;
    metric: string;
    target: number;
    current: number;
    unit?: string;
    valuePerUnit?: number;
    createdAt?: Timestamp;
}

export type Alert = {
    id: string;
    type: "Urgent" | "Reminder" | "Info";
    message: string;
    priority: "High" | "Medium" | "Low";
    action: string;
    creatorId: string;
    createdAt?: Timestamp;
    readBy?: string[];
}

export type Task = {
    id: string;
    title: string;
    completed: boolean;
    dueDate?: string;
    createdAt?: Timestamp;
}

export type User = {
    id: string;
    name: string;
    email: string;
    role: string;
    photoURL?: string;
    createdAt?: Timestamp;
}

export type KeyResult = {
  id: string;
  title: string;
  description: string;
  currentProgress: number;
  target: number;
  deadline: string;
  priority: 'High' | 'Medium' | 'Low';
};

export type ExpenseItem = {
    description: string;
    category: "Transport" | "Rent" | "Office Dev't" | "Projects" | "Stationery" | "Registration" | "Meetings" | "Media" | "Fuel" | "Printing & Photocopy" | "Phone" | "Food" | "Mobile Money Charges" | "IGA Expense" | "Allowances and stipends" | "Kibanja" | "Professional Services" | "community support" | "miscellaneous" | "Withdraw";
    amount: number;
}

export type Expense = {
    id: string;
    userId: string;
    userName: string;
    date: string;
    items: ExpenseItem[];
    totalAmount: number;
    type: "Requisition" | "Reimbursement";
    status: "Pending" | "Approved" | "Rejected" | "Disbursed" | "Acknowledged";
    createdAt?: Timestamp;
    title: string;
};

export type Income = {
    id: string;
    source: string;
    amount: number;
    dateReceived: string;
    type: "Member Donations" | "Fundraising" | "In-kind Contributions" | "Grants" | "Partnerships" | "Omuto Essentials" | "Imac Enterprises" | "Other";
    notes?: string;
    createdAt?: Timestamp;
};

export type Proposal = {
    id: string;
    title: string;
    partnerName: string;
    amountRequested: number;
    status: "Draft" | "Submitted" | "In Review" | "Approved" | "Rejected";
    submissionDate: string;
    decisionDate?: string;
    createdAt?: Timestamp;
    conceptNote?: string;
}

export type PriorityItem = {
    activity: string;
    priority: 'High' | 'Medium' | 'Low';
    responsible: string[];
    deadline?: string | Timestamp;
}

export type TeamWeeklyPlan = {
  id: string;
  weekOf: Timestamp;
  keyPriorities: PriorityItem[];
  message: string;
  authorId: string;
  authorName: string;
  status: 'Draft' | 'Published';
  createdAt: Timestamp;
};


export type WeeklyWorkplan = {
  id: string;
  userId: string;
  userName: string;
  weekOf: Timestamp;
  teamPlanId: string;
  teamPriorities: PriorityItem[];
  individualTasks: string[];
  createdAt: Timestamp;
};


export const DailyPlannerAIOutputSchema = z.object({
    timeBlocks: z.array(z.object({
        startTime: z.string().describe("e.g., '09:00 AM'"),
        endTime: z.string().describe("e.g., '11:00 AM'"),
        description: z.string(),
    })).describe("A detailed, actionable schedule for the day."),
    multiWinConnections: z.array(z.string()).describe("Specific ways the daily mission connects to broader organizational goals (e.g., specific Key Results)."),
    materials: z.string().describe("A comma-separated list of materials or resources needed."),
    challenges: z.string().describe("Potential challenges for the day's mission and a concrete mitigation strategy for each."),
    bestPractice: z.string().describe("A single, highly relevant productivity or strategic thinking tip related to the user's mission and role, drawing from the provided knowledge base."),
});
export type DailyPlannerAIOutput = z.infer<typeof DailyPlannerAIOutputSchema>;


export type Equipment = {
    id: string;
    name: string;
    category: string;
    status: "Available" | "In Use" | "Under Maintenance";
    condition: "Good" | "Fair" | "Poor";
    currentHolder: string;
    purchaseDate?: string;
    createdAt: Timestamp;
}

export type TaskTemplate = {
    id: string;
    title: string;
    checklistItems: string[];
    createdAt: Timestamp;
};

export type Message = {
    id: string;
    text: string;
    userId: string;
    userName: string;
    userAvatar: string;
    createdAt: Timestamp;
};

export type Testimony = {
    id: string;
    title: string;
    text?: string;
    summary?: string;
    quotes?: string[];
    hashtags?: string[];
    userId: string;
    userName: string;
    videoUrl?: string;
    audioUrl?: string;
    createdAt: Timestamp;
};

export type Checklist = {
  id: string;
  title: string;
  category: string;
  sections: {
    title: string;
    items: string[];
  }[];
};


// Smart Reminders Flow Types
export const SmartRemindersInputSchema = z.object({
  userName: z.string(),
  userRole: z.string(),
  upcomingEvents: z.array(z.any()),
  pendingTasks: z.array(z.any()),
});
export type SmartRemindersInput = z.infer<typeof SmartRemindersInputSchema>;

export const SmartRemindersOutputSchema = z.object({
  reminders: z.array(z.string()).describe('A list of 3-4 concise, actionable, and personalized reminders.'),
});
export type SmartRemindersOutput = z.infer<typeof SmartRemindersOutputSchema>;


// Global Search Flow Types
export const SearchInputSchema = z.object({
  query: z.string().describe("The user's natural language search query."),
});
export type SearchInput = z.infer<typeof SearchInputSchema>;

export const SearchResultItemSchema = z.object({
    id: z.string(),
    type: z.string().describe("The type of the entity (e.g., 'User', 'Program', 'Expense')."),
    title: z.string().describe("The main title or name of the item."),
    url: z.string().describe("The in-app URL to navigate to the item."),
});

export const SearchOutputSchema = z.object({
  results: z.array(SearchResultItemSchema).describe('A list of search results.'),
});
export type SearchOutput = z.infer<typeof SearchOutputSchema>;

export type Meeting = {
    id: string;
    partnerId: string;
    partnerName: string;
    date: Timestamp;
    attendees: string;
    type: "Exploration" | "Proposal" | "Progress" | "Problem" | "Renewal";
    decisions?: string;
    actionItems?: string[];
    nextSteps: string;
    createdAt: Timestamp;
};

export type HealthCheck = {
    id: string;
    partnerId: string;
    partnerName: string;
    checkDate: Timestamp;
    communication: number;
    delivery: number;
    alignment: number;
    value: number;
    issues: string;
    recommendation: "Continue" | "Improve" | "Pause" | "Terminate";
    nextReviewDate: string;
    checkedBy: string;
    createdAt: Timestamp;
};
    
