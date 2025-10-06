
import type { Timestamp } from 'firebase/firestore';

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

export type Checkin = {
    id: string;
    userId: string;
    name: string;
    primaryMission: string;
    secondaryWins: string[];
    communityResources: string[];
    timestamp: Timestamp;
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
    date: Date;
    title: string;
    description: string;
    responsible: string;
    location: string;
    category: "Team Meetings" | "Field Visits" | "Campaigns/Events" | "Deadlines" | "Social Days";
};

export type Program = {
    id: string;
    title: string;
    description: string;
    lead: string;
    status: "On Track" | "At Risk" | "Delayed" | "Completed";
    deadline: string;
    objectives: string[];
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
    userName: string;
    actualCost: number;
    totalValue: number;
    finalRoi: number;
    loggedAt: {
      toDate: () => Date;
    };
};

export type Project = {
    id: string;
    name: string;
    manager: string;
    districts: string;
    status: "Active" | "Moderate" | "At Risk" | "Delayed";
    completion: number;
    nextMilestone: string;
}

export type ImpactMetric = {
    metric: string;
    target: number;
    current: number;
    unit: string;
}

export type Alert = {
    type: "Urgent" | "Reminder" | "Info";
    message: string;
    priority: "High" | "Medium" | "Low";
    action: string;
}

export type Task = {
    id: string;
    title: string;
    completed: boolean;
    dueDate?: string;
}

    