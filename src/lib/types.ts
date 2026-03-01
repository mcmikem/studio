

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

// This is now deprecated and replaced by the full Checkout type.
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
  mood: string;
  details?: DailyPlannerAIOutput;
  timestamp: Timestamp;
};

export type Checkout = {
  id?: string;
  name: string;
  role: string;
  avatar: string;
  tasks: {
      description: string;
      status: 'Done' | 'Not Done';
      reason?: string;
  }[];
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
  type: z.enum(["NGO", "Government", "Corporate", "Individual", "School", "CBO", "Faith-Based"]), // Added School, CBO, Faith-Based
  focusAreas: z.array(z.string()).optional(),

  // Contacts
  contactPerson: z.string(),
  contactRole: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional(), // Made email optional as some rural schools might not have one

  // School Specifics
  schoolDetails: z.object({
      headTeacher: z.string().optional(),
      studentPopulation: z.number().optional(),
      level: z.enum(["Primary", "Secondary", "Tertiary", "Vocational"]).optional(),
      programs: z.array(z.string()).optional(), // e.g., ["Green Schools", "OFA"]
      championTeacher: z.string().optional(),
      championTeacherContact: z.string().optional(),
  }).optional(),

  // Value Exchange
  offers: z.array(z.string()).optional(),
  receives: z.array(z.string()).optional(),
  financialValue: z.number().optional(),
  inKindValue: z.string().optional(),
  strategicValue: z.string().optional(),
  strategicFit: z.number().optional(),

  // Pipeline
  resourcePotential: z.enum(["High", "Medium", "Low"]).optional(),
  riskLevel: z.enum(["High", "Medium", "Low"]).optional(),
  priority: z.enum(["Immediate", "Short-term", "Long-term"]).optional(),
  status: z.enum(["Prospecting", "Negotiation", "Active", "Stalled", "Terminated"]),
  health: z.enum(["Strong", "Needs Attention", "At Risk"]).optional(),

  // Actions
  nextStep: z.string(),
  nextActionDate: z.any().optional(), // Timestamp or Date string

  createdAt: z.any(),
  lastContacted: z.any(),
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
    keyResultId?: string;
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
    status: "Active" | "Moderate" | "At Risk" | "Delayed" | "Completed";
    completion: number;
    nextMilestone: string;
    createdAt?: Timestamp;
    participants?: number;
    attendanceRate?: number;
    learningImprovement?: number;
    adoptionRate?: number;
    partner?: string;
    startDate?: string;
    endDate?: string;
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
    targetUserIds?: string[];
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
    supervisorId?: string;
}

export type KeyResult = {
    id: string,
    title: string,
    description: string,
    currentProgress: number,
    target: number,
    deadline: Timestamp, // Firestore Timestamp
    priority: 'High' | 'Medium' | 'Low'
};

export const expenseItemCategories = [
    "Transport", "Rent", "Office Dev't", "Projects", "Stationery", 
    "Registration", "Meetings", "Media", "Fuel", "Printing & Photocopy", 
    "Phone", "Food", "Mobile Money Charges", "IGA Expense", 
    "Allowances and Stipends", "Kibanja", "Professional Services", 
    "community support", "miscellaneous", "Withdraw", "Raw Materials"
] as const;

export type ExpenseItem = {
    description: string;
    category: typeof expenseItemCategories[number];
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
    projectId?: string;
    projectName?: string;
    submittedFor?: string; // Adding the missing field
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
  teamPlanId?: string;
  teamPriorities?: PriorityItem[];
  individualTasks: string[];
  createdAt: Timestamp;
};


export type Equipment = {
    id: string;
    name: string;
    category: string;
    status: "Available" | "In Use" | "Under Maintenance";
    condition: "Good" | "Fair" | "Poor";
    currentHolder: string;
    purchaseDate?: string;
    createdAt: Timestamp;
};

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
  userId: string;
  userName: string;
  beneficiaryName: string;
  project: string;
  beforeSituation: string;
  afterSituation: string;
  quote: string;
  mediaUrls: string[];
  consentSigned: boolean;
  createdAt: Timestamp;
  summary?: string;
  transcription?: string;
  quotes?: string[];
  hashtags?: string[];
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

export type SchoolVisit = {
    id: string;
    programId: string;
    schoolName: string;
    dateOfVisit: string;
    objectivesMet: string;
    challengesObserved?: string;
    teacherFeedback?: string;
    studentFeedback?: string;
    createdAt: Timestamp;
    userId: string;
    userName: string;
};

export type TreeSurvivalSurvey = {
    id: string;
    originalPlantingActivityId: string;
    surveyDate: string;
    numberOfTreesSurvived: number;
    conditionOfTrees: "Good" | "Fair" | "Poor";
    notes?: string;
    createdAt: Timestamp;
    userId: string;
    userName: string;
};

export type Beneficiary = {
    id: string;
    name: string;
    dob: string;
    gender: 'Male' | 'Female';
    village: string;
    programEnrolled: string;
    school?: string;
    phone?: string;
    guardianContact?: string;
    photoURL?: string | null;
    createdAt: Timestamp;
}

export type AttendanceRecord = {
    id: string;
    eventName: string;
    date: string;
    participantName: string;
    gender: 'Male' | 'Female' | 'Other';
    age: number;
    schoolOrCommunity?: string;
    contact?: string;
    signature: boolean;
    createdAt: Timestamp;
}

export type BaselineSurvey = {
    id: string;
    beneficiaryId: string;
    surveyDate: string;
    skillLevel: number;
    monthlyIncome?: number;
    primaryChallenge: string;
    programGoals: string;
    createdAt: Timestamp;
}

export type EndlineSurvey = {
    id: string;
    beneficiaryId: string;
    surveyDate: string;
    skillLevel: number;
    monthlyIncome?: number;
    changesNoticed: string;
    satisfaction: number;
    createdAt: Timestamp;
}

export type PadsDistribution = {
    id: string;
    date: string;
    school: string;
    numberOfPads: number;
    girlsReached: number;
    notes?: string;
    createdAt: Timestamp;
    userId: string;
}

export type MhmTraining = {
    id: string;
    session: string;
    date: string;
    participants: { name: string; age: number; class?: string; }[];
    createdAt: Timestamp;
    userId: string;
}

export type EnvironmentalClub = {
    id: string;
    schoolName: string;
    clubName: string;
    membersCount: number;
    leaderName: string;
    leaderContact?: string;
    createdAt: Timestamp;
    userId: string;
}

export type WasteAudit = {
    id: string;
    schoolName: string;
    date: string;
    wasteSources: string;
    disposalMethod: string;
    recommendations?: string;
    createdAt: Timestamp;
    userId: string;
}

export type SLF_School = {
    id: string;
    schoolName: string;
    headTeacherName: string;
    contactTeacher: string;
    phone: string;
    enrollmentSize: number;
    location: string;
    createdAt: Timestamp;
}

export type SLF_Prefect = {
    id: string;
    schoolId: string;
    schoolName: string;
    name: string;
    position: string;
    class: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other';
    phone?: string;
    createdAt: Timestamp;
}

export type SLF_Training = {
    id: string;
    schoolId: string;
    schoolName: string;
    session: string;
    date: string;
    attendees: { prefectId: string; prefectName: string; attended: boolean }[];
    createdAt: Timestamp;
}

export type PrefectPerformance = {
    id: string;
    prefectId: string;
    prefectName: string;
    schoolId: string;
    month: string;
    visibilityScore: number;
    disciplineScore: number;
    initiativeScore: number;
    achievements?: string;
    teacherComments?: string;
    createdAt: Timestamp;
}

export type YoSkillsCircle = {
  id: string;
  circleName: string;
  coach: string;
  location: string;
  membersCount: number;
  createdAt: Timestamp;
}

export type YoSkillsYouth = {
  id: string;
  circleId: string;
  name: string;
  age: number;
  phone: string;
  educationLevel: string;
  businessInterest: string;
  createdAt: Timestamp;
}

export type YoSkillsSession = {
  id: string;
  circleId: string;
  date: string;
  topic: string;
  membersPresent: string[];
  createdAt: Timestamp;
}

export type BusinessIdea = {
  id: string;
  youthId: string;
  businessName: string;
  problemSolved: string;
  targetCustomer: string;
  startupCapitalNeeded: number;
  createdAt: Timestamp;
}

export type PitchScore = {
  id: string;
  businessIdeaId: string;
  judgeName: string;
  innovation: number;
  feasibility: number;
  scalability: number;
  totalScore: number;
  createdAt: Timestamp;
}

export type BusinessProgress = {
  id: string;
  businessIdeaId: string;
  month: string;
  monthlySales: number;
  challenges: string;
  supportNeeded: string;
  createdAt: Timestamp;
}

export const OFAPlayerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "Player's name is required."),
  teamId: z.string().min(1, 'Team is required.'),
  ageCategory: z.enum(['U13', 'U15', 'U17', 'U19']),
  age: z.coerce.number().optional().nullable(),
  photo: z.any().optional(),
  playingPosition: z.enum(["Goalkeeper", "Defender", "Midfielder", "Forward"]).optional().nullable(),
  school: z.string().optional().nullable(),
  class: z.string().optional().nullable(),
  schoolAttendance: z.enum(["Good", "Fair", "Poor", "Not Applicable"]).optional().nullable(),
  academicPerformance: z.enum(["Good", "Fair", "Poor", "Not Applicable"]).optional().nullable(),
  medicalConditions: z.string().optional().nullable(),
  guardianName: z.string().optional().nullable(),
  guardianContact: z.string().optional().nullable(),
  strengths: z.string().optional().nullable(),
  weaknesses: z.string().optional().nullable(),
  careerDream: z.string().optional().nullable(),
  skillGoal: z.string().optional().nullable(),
  schoolGoal: z.string().optional().nullable(),
  behaviourGoal: z.string().optional().nullable(),
});
export type OFAPlayerFormData = z.infer<typeof OFAPlayerSchema>;

export type OFAPlayer = {
  id: string;
  name: string;
  teamId: string;
  teamName: string;
  ageCategory: 'U13' | 'U15' | 'U17' | 'U19';
  age?: number | null;
  photoUrl?: string | null;
  playingPosition?: "Goalkeeper" | "Defender" | "Midfielder" | "Forward" | null;
  school?: string | null;
  class?: string | null;
  schoolAttendance?: "Good" | "Fair" | "Poor" | "Not Applicable" | null;
  academicPerformance?: "Good" | "Fair" | "Poor" | "Not Applicable" | null;
  medicalConditions?: string | null;
  guardianName?: string | null;
  guardianContact?: string | null;
  strengths?: string | null;
  weaknesses?: string | null;
  careerDream?: string | null;
  skillGoal?: string | null;
  schoolGoal?: string | null;
  behaviourGoal?: string | null;
  createdAt: Timestamp;
};


export type OFAMatch = {
  id: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  goalScorers?: string;
  assists?: string;
  cards?: string;
  referee?: string;
  createdAt: Timestamp;
};

export const OFAMatchSummary = z.object({
  id: z.string(),
  region: z.string(),
  teamA: z.string(),
  teamB: z.string(),
  finalScore: z.string(),
  bestPerformers: z.string().optional(),
  injuries: z.enum(['Yes', 'No']),
  teamADiscipline: z.number(),
  teamACards: z.string().optional(),
  teamBDiscipline: z.number(),
  teamBCards: z.string().optional(),
  quickNotes: z.string().optional(),
  createdAt: z.any(),
});
export type OFAMatchSummary = z.infer<typeof OFAMatchSummary>;


export const OFAAdvancedAnalysis = z.object({
  id: z.string(),
  homeTeam: z.string(),
  awayTeam: z.string(),
  homePossession: z.number().optional(),
  awayPossession: z.number().optional(),
  homeShots: z.number().optional(),
  awayShots: z.number().optional(),
  homeSaves: z.number().optional(),
  awaySaves: z.number().optional(),
  homePassSuccess: z.number().optional(),
  awayPassSuccess: z.number().optional(),
  homeFormation: z.string().optional(),
  homeStrengths: z.string().optional(),
  homeWeaknesses: z.string().optional(),
  homeAdjustments: z.string().optional(),
  awayFormation: z.string().optional(),
  awayStrengths: z.string().optional(),
  awayWeaknesses: z.string().optional(),
  awayAdjustments: z.string().optional(),
  createdAt: z.any(),
});
export type OFAAdvancedAnalysis = z.infer<typeof OFAAdvancedAnalysis>;

export const OFAEquipmentImpact = z.object({
  id: z.string(),
  teamId: z.string(),
  item: z.string(),
  dateGiven: z.string(),
  beforeSupport: z.string().optional(),
  thirtyDays: z.string().optional(),
  sixtyDays: z.string().optional(),
  ninetyDays: z.string().optional(),
  realImpact: z.string().optional(),
  createdAt: z.any(),
});
export type OFAEquipmentImpact = z.infer<typeof OFAEquipmentImpact>;

export const PulseContent = z.object({
  id: z.string(),
  creatorName: z.string(),
  contentTitle: z.string(),
  format: z.enum(["Video", "Podcast", "Article", "Photo"]),
  link: z.string().url(),
  description: z.string().optional(),
  dateCreated: z.string(),
  createdAt: z.any(),
});
export type PulseContent = z.infer<typeof PulseContent>;

export const SaleItemSchema = z.object({
    product_id: z.string().min(1, "Product is required."),
    product_name: z.string(),
    quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
    unit_price: z.coerce.number().min(0),
    total: z.coerce.number(),
});
export type SaleItem = z.infer<typeof SaleItemSchema>;

export const SaleSchema = z.object({
    id: z.string(),
    transaction_number: z.string(),
    customer_name: z.string().optional(),
    customer_phone: z.string().optional(),
    sale_date: z.string(),
    total_amount: z.number(),
    payment_method: z.enum(["Cash", "Mobile Money", "Bank Transfer"]),
    status: z.enum(["completed", "pending"]),
    created_by: z.string(),
    items: z.array(SaleItemSchema),
    createdAt: z.any(),
    updatedAt: z.any().optional(),
});

export const SaleFormSchema = SaleSchema.omit({ 
    id: true, 
    createdAt: true, 
    updatedAt: true,
    transaction_number: true,
    created_by: true,
});
export type SaleFormData = z.infer<typeof SaleFormSchema>;
export type Sale = z.infer<typeof SaleSchema>;
  
// Flow-specific types, centralized here

export const SearchResultItemSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  url: z.string(),
});
export type SearchResultItem = z.infer<typeof SearchResultItemSchema>;

export const AlertInputSchema = z.object({
  type: z.enum(['Urgent', 'Reminder', 'Info']),
  message: z.string(),
  priority: z.enum(['High', 'Medium', 'Low']),
  action: z.string(),
  creatorId: z.string(),
  targetUserIds: z.array(z.string()).optional(),
});
export type AlertInput = z.infer<typeof AlertInputSchema>;

export const KeyResultAISchema = z.object({
  title: z.string(),
  description: z.string(),
  deadline: z.string(),
});
export type KeyResultAI = z.infer<typeof KeyResultAISchema>;

export const DailyPlannerAIInputSchema = z.object({
  userName: z.string(),
  userRole: z.string(),
  primaryMission: z.string(),
  weeklyPriorities: z.array(z.string()),
  keyResults: z.array(KeyResultAISchema),
});
export type DailyPlannerAIInput = z.infer<typeof DailyPlannerAIInputSchema>;

export const DailyPlannerAIOutputSchema = z.object({
  timeBlocks: z.array(
    z.object({
      startTime: z.string(),
      endTime: z.string(),
      description: z.string(),
    })
  ),
  strategicAlignments: z.array(
    z.object({
      krTitle: z.string(),
      alignmentJustification: z.string(),
    })
  ),
  materials: z.string(),
  challenges: z.string(),
  bestPractice: z.string(),
});
export type DailyPlannerAIOutput = z.infer<typeof DailyPlannerAIOutputSchema>;

export const StrategicAdvisorInputSchema = z.object({
  activities: z.array(z.any()).describe('Array of activity objects from the last 30 days.'),
  checkins: z.array(z.any()).describe('Array of check-in objects from today.'),
  expenses: z.array(z.any()).describe('Array of expense objects from the last 30 days.'),
  keyResults: z.array(z.any()).describe('Array of the current operational plan\'s key results.'),
});
export type StrategicAdvisorInput = z.infer<typeof StrategicAdvisorInputSchema>;


export const StrategicAdvisorOutputSchema = z.object({
  insights: z.array(z.object({
    emoji: z.string().describe('An emoji representing the insight (e.g., "📈", "⚠️", "💡").'),
    title: z.string().describe('A very short, catchy title for the insight.'),
    description: z.string().describe('A concise, one-sentence description of the key finding.'),
    recommendation: z.string().describe('A single, actionable recommendation for the leader.'),
  })).describe('A list of 3-4 high-level strategic insights.'),
});
export type StrategicAdvisorOutput = z.infer<typeof StrategicAdvisorOutputSchema>;

export const ImpactStoryInputSchema = z.object({
    activityName: z.string(),
    activityDescription: z.string(),
    activityImpact: z.string(),
    userName: z.string(),
    userQuote: z.string().optional(),
    memorableMoment: z.string().optional(),
    challengesLearned: z.string().optional(),
});
export type ImpactStoryInput = z.infer<typeof ImpactStoryInputSchema>;

export const ImpactStoryOutputSchema = z.object({
    impactStory: z.string().describe("A compelling narrative suitable for social media and Omuto Pulse."),
});
export type ImpactStoryOutput = z.infer<typeof ImpactStoryOutputSchema>;

export const TestimonyInputSchema = z.object({
  mediaUri: z.string().describe("A data URI of the audio or video file to be processed."),
});
export type TestimonyInput = z.infer<typeof TestimonyInputSchema>;

export const TestimonyOutputSchema = z.object({
  transcription: z.string().describe("The full transcription of the testimony."),
  summary: z.string().describe("A concise summary of the key points."),
  quotes: z.array(z.string()).describe("A list of impactful quotes from the testimony."),
  hashtags: z.array(z.string()).describe("A list of relevant social media hashtags."),
});
export type TestimonyOutput = z.infer<typeof TestimonyOutputSchema>;

export const ParsePlanInputSchema = z.object({
    planText: z.string().describe("The raw text of the operational plan."),
});
export type ParsePlanInput = z.infer<typeof ParsePlanInputSchema>;

export const ParsePlanOutputSchema = z.object({
    keyResults: z.array(z.object({
        title: z.string(),
        description: z.string(),
        target: z.number(),
        deadline: z.string(),
        priority: z.enum(['High', 'Medium', 'Low']),
        currentProgress: z.number(),
    })),
});
export type ParsePlanOutput = z.infer<typeof ParsePlanOutputSchema>;

export const GenerateTemplateInputSchema = z.object({
    description: z.string().describe("A description of the process to be turned into a template."),
});
export type GenerateTemplateInput = z.infer<typeof GenerateTemplateInputSchema>;

export const GenerateTemplateOutputSchema = z.object({
    title: z.string().describe("The generated title for the template."),
    checklistItems: z.array(z.string()).describe("A list of actionable checklist items."),
});
export type GenerateTemplateOutput = z.infer<typeof GenerateTemplateOutputSchema>;

export const ParseWorkplanInputSchema = z.object({
    textPlan: z.string().describe("The unstructured text of the weekly workplan."),
});
export type ParseWorkplanInput = z.infer<typeof ParseWorkplanInputSchema>;

export const ParseWorkplanOutputSchema = z.object({
    keyPriorities: z.array(z.object({
        activity: z.string(),
        priority: z.enum(['High', 'Medium', 'Low']),
        responsible: z.array(z.string()),
        deadline: z.string().optional(),
    })),
    message: z.string(),
});
export type ParseWorkplanOutput = z.infer<typeof ParseWorkplanOutputSchema>;

export const QualitativeAnalysisInputSchema = z.object({
    programId: z.string(),
    programName: z.string(),
    startDate: z.string(),
    endDate: z.string(),
});
export type QualitativeAnalysisInput = z.infer<typeof QualitativeAnalysisInputSchema>;

export const QualitativeAnalysisOutputSchema = z.object({
    summary: z.string().describe("A concise executive summary of the findings."),
    recurringSuccesses: z.array(z.string()).describe("A list of common success themes."),
    commonChallenges: z.array(z.string()).describe("A list of recurring challenges."),
    keyLearnings: z.array(z.string()).describe("A list of actionable takeaways."),
});
export type QualitativeAnalysisOutput = z.infer<typeof QualitativeAnalysisOutputSchema>;

export const GrantFinderInputSchema = z.object({
  query: z.string().describe('The search query for grants.'),
});
export type GrantFinderInput = z.infer<typeof GrantFinderInputSchema>;

export const GrantFinderOutputSchema = z.object({
  opportunities: z.array(z.object({
    title: z.string(),
    funder: z.string(),
    description: z.string(),
    amount: z.number(),
    deadline: z.string(),
  })).describe('A list of potential grant opportunities found.'),
});
export type GrantFinderOutput = z.infer<typeof GrantFinderOutputSchema>;

export const GrantWriterInputSchema = z.object({
  proposalTitle: z.string(),
  partnerName: z.string(),
  amountRequested: z.number(),
});
export type GrantWriterInput = z.infer<typeof GrantWriterInputSchema>;

export const GrantWriterOutputSchema = z.object({
  conceptNote: z.string().describe('A markdown string of the generated concept note.'),
});
export type GrantWriterOutput = z.infer<typeof GrantWriterOutputSchema>;

export const OmutoAIInputSchema = z.object({
  question: z.string(),
  history: z.array(z.any()).optional(),
  userId: z.string(),
});
export type OmutoAIInput = z.infer<typeof OmutoAIInputSchema>;

export const OmutoAIOutputSchema = z.object({
  answer: z.string(),
});
export type OmutoAIOutput = z.infer<typeof OmutoAIOutputSchema>;

export const SmartRemindersInputSchema = z.object({
  userName: z.string(),
  userRole: z.string(),
  userId: z.string(),
});
export type SmartRemindersInput = z.infer<typeof SmartRemindersInputSchema>;

export const SmartRemindersOutputSchema = z.object({
  reminders: z.array(z.string()).describe('A list of 3-4 concise, actionable, and personalized reminders.'),
});
export type SmartRemindersOutput = z.infer<typeof SmartRemindersOutputSchema>;
