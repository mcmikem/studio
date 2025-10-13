


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

export type Partnership = {
    id: string;
    name: string;
    contactPerson: string;
    contactEmail: string;
    status: "Active" | "Potential" | "Inactive";
    nextStep: string;
    createdAt?: Timestamp;
}

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
    category: "Transport" | "Materials" | "Food" | "Airtime" | "Other";
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
    type: "Grant" | "Donation" | "Sales" | "Other";
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
}

export type PriorityItem = {
    activity: string;
    priority: 'High' | 'Medium' | 'Low';
    responsible: string;
    deadline?: string;
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
}

export type Testimony = {
    id: string;
    title: string;
    text?: string;
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
  userId: z.string(),
  userName: z.string(),
  userRole: z.string(),
});
export type SmartRemindersInput = z.infer<typeof SmartRemindersInputSchema>;

export const SmartRemindersOutputSchema = z.object({
  reminders: z.array(z.string()).describe('A list of 3-4 concise, actionable, and personalized reminders.'),
});
export type SmartRemindersOutput = z.infer<typeof SmartRemindersOutputSchema>;
