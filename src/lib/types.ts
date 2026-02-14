

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

export const KeyResultAISchema = z.object({
  title: z.string(),
  description: z.string(),
  deadline: z.string(), // YYYY-MM-DD format as a string
});
export type KeyResultAI = z.infer<typeof KeyResultAISchema>;

export type ExpenseItem = {
    description: string;
    category: "Transport" | "Rent" | "Office Dev't" | "Projects" | "Stationery" | "Registration" | "Meetings" | "Media" | "Fuel" | "Printing & Photocopy" | "Phone" | "Food" | "Mobile Money Charges" | "IGA Expense" | "Allowances and Stipends" | "Kibanja" | "Professional Services" | "community support" | "miscellaneous" | "Withdraw";
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
    submittedFor?: string;
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


// Smart Reminders Flow Types
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
export type SearchResultItem = z.infer<typeof SearchResultItemSchema>;

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

export const OFAScorecardSchema = z.object({
  id: z.string(),
  teamId: z.string(),
  teamName: z.string(),
  trainingAttendance: z.number(),
  coachingQuality: z.number(),
  playerDiscipline: z.number(),
  academicAttendance: z.number(),
  parentEngagement: z.number(),
  communityReputation: z.number(),
  achievements: z.string().optional(),
  challenges: z.string().optional(),
  supportNeeded: z.string().optional(),
  createdAt: z.any(),
  month: z.string().min(1, "Month is required."),
});
export type OFAScorecard = z.infer<typeof OFAScorecardSchema>;


export type OFAMatchSummary = {
  id: string;
  region: string;
  teamA: string;
  teamB: string;
  finalScore: string;
  bestPerformers?: string;
  injuries: 'Yes' | 'No';
  teamADiscipline: number;
  teamACards?: string;
  teamBDiscipline: number;
  teamBCards?: string;
  quickNotes?: string;
  createdAt: Timestamp;
};

export type OFAAdvancedAnalysis = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homePossession?: number;
  awayPossession?: number;
  homeShots?: number;
  awayShots?: number;
  homeSaves?: number;
  awaySaves?: number;
  homePassSuccess?: number;
  awayPassSuccess?: number;
  homeFormation?: string;
  homeStrengths?: string;
  homeWeaknesses?: string;
  homeAdjustments?: string;
  awayFormation?: string;
  awayStrengths?: string;
  awayWeaknesses?: string;
  awayAdjustments?: string;
  createdAt: Timestamp;
};

export type OFAEquipmentImpact = {
  id: string;
  teamId: string;
  item: string;
  dateGiven: string;
  beforeSupport?: string;
  thirtyDays?: string;
  sixtyDays?: string;
  ninetyDays?: string;
  realImpact?: string;
  createdAt: Timestamp;
};

export type PulseContent = {
  id: string;
  creatorName: string;
  contentTitle: string;
  format: "Video" | "Podcast" | "Article" | "Photo";
  link: string;
  description?: string;
  dateCreated: string;
  createdAt: Timestamp;
};

export type ProductionLog = {
  id: string;
  batchNumber: string;
  product: "Liquid Soap" | "Aloe Wash" | "Other";
  date: string;
  quantity: number;
  materialsUsed?: string;
  producedBy: string;
  createdAt: Timestamp;
};

export type Sale = {
  id: string;
  date: string;
  salesAgent: string;
  product: "Liquid Soap" | "Aloe Wash" | "Other";
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paymentMethod: "Cash" | "Mobile Money";
  createdAt: Timestamp;
};

export type InventoryCheck = {
  id: string;
  date: string;
  product: "Liquid Soap" | "Aloe Wash" | "Other";
  physicalCount: number;
  discrepancyReason?: string;
  createdAt: Timestamp;
};

export type WaterSource = {
  id: string;
  sourceName: string;
  type: "Borehole" | "Spring" | "Tap" | "Rainwater";
  gpsCoordinates?: string;
  functional: boolean;
  photoUrl?: string;
  createdAt: Timestamp;
};

export type WASH_Assessment = {
  id: string;
  school: string;
  handwashingStations: number;
  soapAvailable: boolean;
  latrineCondition: "Good" | "Fair" | "Poor";
  assessorComments?: string;
  createdAt: Timestamp;
};

export type YAP_Chapter = {
  id: string;
  chapterName: string;
  location: string;
  leader: string;
  membersCount: number;
  createdAt: Timestamp;
};

export type YAP_Report = {
  id: string;
  chapterId: string;
  month: string;
  activities: string;
  attendance: number;
  outcomes: string;
  challenges?: string;
  createdAt: Timestamp;
};

export type SeedGrantApplication = {
  id: string;
  applicantName: string;
  projectTitle: string;
  budgetSummaryUrl?: string;
  amountRequested: number;
  startDate: string;
  endDate: string;
  createdAt: Timestamp;
};

export type SeedGrantAccountability = {
  id: string;
  grantId: string;
  totalSpent: number;
  receiptUrls: string[];
  outputDescription: string;
  createdAt: Timestamp;
};

export const OFATeamSchema = z.object({
  id: z.string().optional(),
  teamName: z.string().min(3, "Team name is required."),
  teamPhotoUrl: z.string().url().optional().nullable(),
  subcounty: z.string().min(3, "Subcounty is required."),
  parish: z.string().optional().nullable(),
  village: z.string().optional().nullable(),
  yearOfEstablishment: z.string().optional().nullable(),
  homePitchName: z.string().optional().nullable(),
  teamColours: z.string().optional().nullable(),
  motto: z.string().optional().nullable(),
  headCoachName: z.string().optional().nullable(),
  headCoachPhone: z.string().optional().nullable(),
  headCoachAttendance: z.enum(['Always', 'Sometimes', 'Rare']).optional().nullable(),
  headCoachAvailability: z.enum(['Full-Time', 'Part-Time']).optional().nullable(),
  assistantCoachName: z.string().optional().nullable(),
  assistantCoachPhone: z.string().optional().nullable(),
  assistantCoachAttendance: z.enum(['Always', 'Sometimes', 'Rare']).optional().nullable(),
  assistantCoachAvailability: z.enum(['Full-Time', 'Part-Time']).optional().nullable(),
  teamManagerName: z.string().optional().nullable(),
  teamManagerPhone: z.string().optional().nullable(),
  teamManagerAttendance: z.enum(['Always', 'Sometimes', 'Rare']).optional().nullable(),
  teamManagerAvailability: z.enum(['Full-Time', 'Part-Time']).optional().nullable(),
  captainName: z.string().optional().nullable(),
  captainPhone: z.string().optional().nullable(),
  captainAttendance: z.enum(['Always', 'Sometimes', 'Rare']).optional().nullable(),
  viceCaptainName: z.string().optional().nullable(),
  viceCaptainPhone: z.string().optional().nullable(),
  viceCaptainAttendance: z.enum(['Always', 'Sometimes', 'Rare']).optional().nullable(),
  trainingDaysPerWeek: z.coerce.number().optional().nullable(),
  avgTrainingAttendance: z.enum(['High', 'Medium', 'Low']).optional().nullable(),
  punctualityScore: z.coerce.number().optional().nullable(),
  disciplineScore: z.coerce.number().optional().nullable(),
  useWarmups: z.boolean().optional().nullable(),
  trackPlayerProgress: z.boolean().optional().nullable(),
  totalPlayers: z.coerce.number().optional().nullable(),
  u13: z.coerce.number().optional().nullable(),
  u15: z.coerce.number().optional().nullable(),
  u17: z.coerce.number().optional().nullable(),
  u19: z.coerce.number().optional().nullable(),
  percentageInSchool: z.coerce.number().optional().nullable(),
  mainAcademicChallenges: z.array(z.string()).optional().nullable(),
  enforceSchoolAttendance: z.enum(['Yes', 'No', 'Trying']).optional().nullable(),
  equipment: z.array(z.object({
    item: z.string(),
    qty: z.coerce.number().optional(),
    condition: z.string().optional(),
    needLevel: z.string().optional(),
  })).optional().nullable(),
  needs: z.array(z.object({
    area: z.string(),
    priority: z.coerce.number().optional(),
  })).optional().nullable(),
  communitySupport: z.enum(['Yes', 'No', 'Sometimes']).optional().nullable(),
  parentEngagement: z.enum(['Yes', 'No', 'Weak Engagement']).optional().nullable(),
  hasVolunteers: z.boolean().optional().nullable(),
  volunteerCount: z.coerce.number().optional().nullable(),
  agreedToRules: z.boolean().refine(val => val === true, {
    message: "You must agree to the rules to register a team.",
  }),
});
export type OFATeamFormData = z.infer<typeof OFATeamSchema>;

export type OFATeam = z.infer<typeof OFATeamSchema> & {
    id: string;
    createdAt: Timestamp;
};


export type OFAVolunteer = {
  id: string;
  name: string;
  role: string;
  contact: string;
  createdAt: Timestamp;
};


// Flow-specific types, centralized here
export const AlertInputSchema = z.object({
  type: z.enum(['Urgent', 'Reminder', 'Info']),
  message: z.string(),
  priority: z.enum(['High', 'Medium', 'Low']),
  action: z.string(),
  creatorId: z.string().describe("The ID of the user creating the alert."),
  targetUserIds: z.array(z.string()).optional().describe("An array of user IDs to target with this notification. If empty, it's a broadcast."),
});
export type AlertInput = z.infer<typeof AlertInputSchema>;

export const GenerateTemplateInputSchema = z.object({
  description: z.string().describe('A natural language description of the checklist or template needed.'),
});
export type GenerateTemplateInput = z.infer<typeof GenerateTemplateInputSchema>;

export const GenerateTemplateOutputSchema = z.object({
  title: z.string().describe('A clear and concise title for the generated template.'),
  checklistItems: z.array(z.string()).describe('A list of specific, actionable checklist items.'),
});
export type GenerateTemplateOutput = z.infer<typeof GenerateTemplateOutputSchema>;


export const GrantFinderInputSchema = z.object({
  query: z.string().describe('The user\'s search query for grant opportunities (e.g., "youth empowerment uganda").'),
});
export type GrantFinderInput = z.infer<typeof GrantFinderInputSchema>;


export const GrantOpportunitySchema = z.object({
  title: z.string(),
  funder: z.string(),
  description: z.string(),
  amount: z.number(),
  deadline: z.string().describe("Formatted as YYYY-MM-DD"),
});
export const GrantFinderOutputSchema = z.object({
  opportunities: z.array(GrantOpportunitySchema).describe('A list of potential grant opportunities found.'),
});
export type GrantFinderOutput = z.infer<typeof GrantFinderOutputSchema>;


export const GrantWriterInputSchema = z.object({
  partnerName: z.string().describe("The name of the potential funder or partner."),
  amountRequested: z.number().describe("The amount of funding being requested in UGX."),
  proposalTitle: z.string().describe("The title of the proposal project."),
});
export type GrantWriterInput = z.infer<typeof GrantWriterInputSchema>;

export const GrantWriterOutputSchema = z.object({
  conceptNote: z.string().describe("A concise and persuasive concept note for the proposal, written in markdown format. It should include sections for Introduction, Problem Statement, Proposed Solution (linking to Omuto's ecosystem model), and Budget Overview."),
});
export type GrantWriterOutput = z.infer<typeof GrantWriterOutputSchema>;

export const ImpactStoryInputSchema = z.object({
  activityName: z.string().describe('The name of the activity.'),
  activityDescription: z.string().describe('A detailed description of the activity.'),
  activityImpact: z.string().describe('The measurable impact of the activity (e.g., number of trees planted, people reached).'),
  userName: z.string().describe('The name of a user involved in the activity, to add a personal touch.'),
  userQuote: z.string().optional().describe('A quote from a user or beneficiary about the activity.'),
  memorableMoment: z.string().optional().describe('A specific, powerful interaction or observation from the activity.'),
  challengesLearned: z.string().optional().describe('Surprising challenges and how they were overcome.'),
});
export type ImpactStoryInput = z.infer<typeof ImpactStoryInputSchema>;

export const ImpactStoryOutputSchema = z.object({
  impactStory: z.string().describe('A compelling narrative generated from the activity data.'),
});
export type ImpactStoryOutput = z.infer<typeof ImpactStoryOutputSchema>;


export const HistoryMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.array(z.object({ text: z.string() })),
});

export const OmutoAIInputSchema = z.object({
  question: z.string().describe("The user's current question or message."),
  history: z.array(HistoryMessageSchema).optional().describe('The chat history between the user and the AI.'),
  userId: z.string().describe("The user's unique ID."), // Added for context
});
export type OmutoAIInput = z.infer<typeof OmutoAIInputSchema>;

export const OmutoAIOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer to the user\'s question.'),
});
export type OmutoAIOutput = z.infer<typeof OmutoAIOutputSchema>;

export const DailyPlannerAIInputSchema = z.object({
  userName: z.string().describe("The name of the user."),
  userRole: z.string().describe('The role of the staff member (e.g., "Programs & Partnerships Manager").'),
  primaryMission: z.string().describe("The user's stated main focus for the day."),
  weeklyPriorities: z.array(z.string()).describe("The user's key priorities for the current week. This may be an empty array if no weekly plan is set."),
  keyResults: z.array(KeyResultAISchema).describe("A list of the organization's current Key Results (OKRs)."),
});
export type DailyPlannerAIInput = z.infer<typeof DailyPlannerAIInputSchema>;


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

export const ParsePlanInputSchema = z.object({
  planText: z.string().describe('The full, unstructured text of the monthly or quarterly operational plan.'),
});
export type ParsePlanInput = z.infer<typeof ParsePlanInputSchema>;

const ParsePlanKeyResultSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string(),
  currentProgress: z.number(),
  target: z.number(),
  deadline: z.string(),
  priority: z.enum(['High', 'Medium', 'Low']),
});

export const ParsePlanOutputSchema = z.object({
  keyResults: z.array(ParsePlanKeyResultSchema).describe('A list of all Key Results extracted from the plan text.'),
});
export type ParsePlanOutput = z.infer<typeof ParsePlanOutputSchema>;


export const ParseWorkplanInputSchema = z.object({
  textPlan: z.string().describe('The unstructured, raw text of a weekly plan.'),
});
export type ParseWorkplanInput = z.infer<typeof ParseWorkplanInputSchema>;

export const PriorityItemSchema = z.object({
    activity: z.string().describe('The specific task or activity to be done.'),
    priority: z.enum(['High', 'Medium', 'Low']).describe('The priority level of the activity.'),
    responsible: z.array(z.string()).describe('A list of names or roles responsible for the activity.'),
    deadline: z.string().optional().describe('The deadline for the activity, if mentioned (YYYY-MM-DD format).'),
});

export const ParseWorkplanOutputSchema = z.object({
  keyPriorities: z.array(PriorityItemSchema).describe('A list of structured priority items extracted from the text.'),
  message: z.string().describe('A one or two-sentence summary of the overall focus or goal for the week.'),
});
export type ParseWorkplanOutput = z.infer<typeof ParseWorkplanOutputSchema>;

export const QualitativeAnalysisInputSchema = z.object({
  programId: z.string().describe('The ID of the program to analyze.'),
  programName: z.string().describe('The name of the program being analyzed.'),
  startDate: z.string().describe('The start date of the range to analyze (YYYY-MM-DD).'),
  endDate: z.string().describe('The end date of the range to analyze (YYYY-MM-DD).'),
});
export type QualitativeAnalysisInput = z.infer<typeof QualitativeAnalysisInput>;


export const QualitativeAnalysisOutputSchema = z.object({
  summary: z.string().describe("A high-level executive summary of the program's qualitative performance during the period."),
  recurringSuccesses: z.array(z.string()).describe("A list of common themes and successes identified from the reports."),
  commonChallenges: z.array(z.string()).describe("A list of recurring challenges or issues faced by the team."),
  keyLearnings: z.array(z.string()).describe("A list of actionable learnings and recommendations for improvement."),
});
export type QualitativeAnalysisOutput = z.infer<typeof QualitativeAnalysisOutputSchema>;


export const TestimonyInputSchema = z.object({
  mediaUri: z.string().describe("A data URI of the audio or video file. Must be in a format supported by Gemini, like webm."),
});
export type TestimonyInput = z.infer<typeof TestimonyInputSchema>;

export const TestimonyOutputSchema = z.object({
  transcription: z.string().describe("The full transcription of the testimony."),
  summary: z.string().describe("A concise one-paragraph summary of the testimony."),
  quotes: z.array(z.string()).describe("A list of 2-3 powerful, impactful quotes from the testimony."),
  hashtags: z.array(z.string()).describe("A list of 3-5 relevant social media hashtags for social media (e.g., #Empowerment, #CommunityImpact)."),
});
export type TestimonyOutput = z.infer<typeof TestimonyOutputSchema>;

// New types for Knowledge Hub
export type KnowledgeHubSection = {
  id: string;
  order: number;
  title: string;
  content: string;
  subsections?: { title: string; content: string; }[];
};

export type KnowledgeHubPitch = {
  id: string;
  order: number;
  title: string;
  content: string;
};

export type KnowledgeHubFAQ = {
  id: string;
  order: number;
  question: string;
  answer: string;
};

export type KnowledgeHubStory = {
  id: string;
  order: number;
  title: string;
  content: string;
};

export type KnowledgeHubCTA = {
  id: string;
  order: number;
  title: string;
  description: string;
  buttonLabel: string;
};
    




  

    

    






    


      