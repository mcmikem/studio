import type { Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';

export const expenseItemCategories = ["Transport", "Rent", "Office Dev't", "Projects", "Stationery", "Registration", "Meetings", "Media", "Fuel", "Printing & Photocopy", "Phone", "Food", "Mobile Money Charges", "IGA Expense", "Allowances and Stipends", "Kibanja", "Professional Services", "community support", "miscellaneous", "Withdraw", "Raw Materials"] as const;

export const UserSchema = z.object({
    id: z.string(),
    role: z.string(),
    name: z.string(),
    email: z.string().email(),
    photoURL: z.string().url().optional(),
    createdAt: z.any().optional(),
    supervisorId: z.string().optional(),
});
export type User = z.infer<typeof UserSchema>;

export const ProgramSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    lead: z.string(),
    status: z.enum(["On Track", "At Risk", "Delayed", "Completed"]),
    deadline: z.string(),
    objectives: z.array(z.string()),
    valuePerObjective: z.number().optional(),
    createdAt: z.any().optional(),
});
export type Program = z.infer<typeof ProgramSchema>;

export const PartnershipSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Partner name is required."),
    type: z.enum(["NGO", "Government", "Corporate", "Individual", "School", "CBO", "Faith-Based"]),
    focusAreas: z.array(z.string()).optional(),
    contactPerson: z.string().min(1, "Contact person is required."),
    contactRole: z.string().optional(),
    contactPhone: z.string().optional(),
    contactEmail: z.string().email().optional(),
    schoolDetails: z.object({
        headTeacher: z.string().optional(),
        studentPopulation: z.number().optional(),
        level: z.enum(["Primary", "Secondary", "Tertiary", "Vocational"]).optional(),
        programs: z.array(z.string()).optional(),
        championTeacher: z.string().optional(),
        championTeacherContact: z.string().optional(),
    }).optional(),
    offers: z.array(z.string()).optional(),
    receives: z.array(z.string()).optional(),
    financialValue: z.number().optional(),
    inKindValue: z.string().optional(),
    strategicValue: z.string().optional(),
    strategicFit: z.number().min(1).max(5).optional(),
    resourcePotential: z.enum(["High", "Medium", "Low"]).optional(),
    riskLevel: z.enum(["High", "Medium", "Low"]).optional(),
    priority: z.enum(["Immediate", "Short-term", "Long-term"]).optional(),
    status: z.enum(["Prospecting", "Negotiation", "Active", "Stalled", "Terminated"]),
    health: z.enum(["Strong", "Needs Attention", "At Risk"]).optional(),
    nextStep: z.string().min(1, "Next step is required."),
    nextActionDate: z.any().optional(),
    createdAt: z.any().optional(),
    lastContacted: z.any().optional(),
});
export type Partnership = z.infer<typeof PartnershipSchema>;

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  manager: z.string(),
  districts: z.string(),
  status: z.enum(["Active", "Moderate", "At Risk", "Delayed", "Completed"]),
  completion: z.number(),
  nextMilestone: z.string(),
  partner: z.string().optional(),
  participants: z.number().optional(),
  attendanceRate: z.number().optional(),
  learningImprovement: z.number().optional(),
  adoptionRate: z.number().optional(),
  startDate: z.any().optional(),
  endDate: z.any().optional(),
  createdAt: z.any().optional(),
});
export type Project = z.infer<typeof ProjectSchema>;

export const ProjectParticipantSchema = z.object({
    id: z.string(),
    name: z.string(),
    phone: z.string().optional(),
    village: z.string().optional(),
    businessStage: z.enum(['Ideation', 'Operating', 'Growth']),
    attendance: z.number().optional(),
    businessScore: z.number().optional(),
    avatar: z.string().url().optional(),
    createdAt: z.any().optional()
});
export type ProjectParticipant = z.infer<typeof ProjectParticipantSchema>;

export const ProjectParticipantFormSchema = ProjectParticipantSchema.omit({ id: true, createdAt: true });
export type ProjectParticipantFormData = z.infer<typeof ProjectParticipantFormSchema>;

export const ActivitySchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string(),
  title: z.string(),
  ecosystem_phase: z.enum(["Identify & Inspire", "Equip & Empower", "Activate & Sustain"]),
  primaryGoalType: z.enum(["Metric", "Program"]),
  primaryGoalId: z.string(),
  primaryGoalQuantity: z.number(),
  estimatedCost: z.number(),
  actualCost: z.number(),
  directValue: z.number(),
  indirectValue: z.number(),
  totalValue: z.number(),
  estimatedRoi: z.number(),
  finalRoi: z.number(),
  loggedAt: z.any(),
  parents_attended: z.number().optional(),
  teachers_attended: z.number().optional(),
  trees_planted: z.number().optional(),
  memorableMoment: z.string().optional(),
  challengesLearned: z.string().optional(),
  beneficiaryQuote: z.string().optional(),
});
export type Activity = z.infer<typeof ActivitySchema>;


export const ExpenseItemSchema = z.object({
    description: z.string().min(1, 'Item description is required.'),
    category: z.enum(expenseItemCategories),
    amount: z.coerce.number().min(1, 'Amount must be greater than zero.'),
});
export type ExpenseItem = z.infer<typeof ExpenseItemSchema>;

export const ExpenseSchema = z.object({
    id: z.string(),
    userId: z.string(),
    userName: z.string(),
    submittedFor: z.string().optional(),
    date: z.any(),
    title: z.string(),
    type: z.enum(["Requisition", "Reimbursement"]),
    items: z.array(ExpenseItemSchema),
    totalAmount: z.number(),
    status: z.enum(["Pending", "Approved", "Rejected", "Disbursed", "Acknowledged"]),
    createdAt: z.any(),
    projectId: z.string().optional(),
    projectName: z.string().optional(),
});
export type Expense = z.infer<typeof ExpenseSchema>;

export const IncomeSchema = z.object({
    id: z.string(),
    source: z.string(),
    amount: z.number(),
    dateReceived: z.any(),
    type: z.string(),
    notes: z.string().optional(),
    createdAt: z.any(),
});
export type Income = z.infer<typeof IncomeSchema>;

export const SaleItemSchema = z.object({
    product_id: z.string(),
    product_name: z.string(),
    quantity: z.number(),
    unit_price: z.number(),
    total: z.number()
});
export type SaleItem = z.infer<typeof SaleItemSchema>;

export const SaleSchema = z.object({
  id: z.string(),
  transaction_number: z.string(),
  customer_name: z.string().optional(),
  customer_phone: z.string().optional(),
  sale_date: z.any(),
  total_amount: z.number(),
  payment_method: z.enum(["Cash", "Mobile Money", "Bank Transfer"]),
  status: z.enum(["completed", "pending"]),
  created_by: z.string(),
  items: z.array(SaleItemSchema)
});
export type Sale = z.infer<typeof SaleSchema>;


export const CalendarEventSchema = z.object({
    id: z.string(),
    title: z.string(),
    date: z.any(),
    category: z.string(),
    location: z.string(),
    responsible: z.string(),
    createdAt: z.any(),
});
export type CalendarEvent = z.infer<typeof CalendarEventSchema>;

export const MessageSchema = z.object({
    id: z.string(),
    text: z.string(),
    userId: z.string(),
    userName: z.string(),
    userAvatar: z.string().optional(),
    createdAt: z.any(),
});
export type Message = z.infer<typeof MessageSchema>;

export const CheckinSchema = z.object({
    id: z.string(),
    userId: z.string(),
    name: z.string(),
    primaryMission: z.string(),
    mood: z.string(),
    details: z.any(),
    timestamp: z.any(),
});
export type Checkin = z.infer<typeof CheckinSchema>;

export const CheckoutTaskSchema = z.object({
  description: z.string(),
  status: z.enum(['Done', 'Not Done']),
  reason: z.string().optional(),
});
export type CheckoutTask = z.infer<typeof CheckoutTaskSchema>;

export const CheckoutSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  role: z.string(),
  avatar: z.string(),
  tasks: z.array(CheckoutTaskSchema),
  learning: z.string().optional(),
  tomorrowPlan: z.string().optional(),
  timestamp: z.any(),
});
export type Checkout = z.infer<typeof CheckoutSchema>;

export const TaskTemplateSchema = z.object({
    id: z.string(),
    title: z.string(),
    checklistItems: z.array(z.string()),
    createdAt: z.any(),
});
export type TaskTemplate = z.infer<typeof TaskTemplateSchema>;

export const KeyResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  currentProgress: z.number(),
  target: z.number(),
  deadline: z.any(),
  priority: z.enum(['High', 'Medium', 'Low']),
});
export type KeyResult = z.infer<typeof KeyResultSchema>;

export const ImpactMetricSchema = z.object({
    id: z.string(),
    metric: z.string(),
    target: z.number(),
    current: z.number(),
    unit: z.string().optional(),
    valuePerUnit: z.number().optional(),
    createdAt: z.any(),
});
export type ImpactMetric = z.infer<typeof ImpactMetricSchema>;

export const AlertSchema = z.object({
    id: z.string(),
    type: z.enum(['Urgent', 'Reminder', 'Info']),
    message: z.string(),
    priority: z.enum(['High', 'Medium', 'Low']),
    action: z.string(),
    creatorId: z.string(),
    createdAt: z.any(),
    readBy: z.array(z.string()).optional(),
    targetUserIds: z.array(z.string()).optional(),
});
export type Alert = z.infer<typeof AlertSchema>;

export const TestimonySchema = z.object({
    id: z.string(),
    title: z.string(),
    userId: z.string(),
    userName: z.string(),
    beneficiaryName: z.string(),
    project: z.string(),
    beforeSituation: z.string(),
    afterSituation: z.string(),
    quote: z.string(),
    mediaUrls: z.array(z.string().url()).optional(),
    consentSigned: z.boolean(),
    createdAt: z.any(),
    transcription: z.string().optional(),
    summary: z.string().optional(),
    quotes: z.array(z.string()).optional(),
    hashtags: z.array(z.string()).optional(),
});
export type Testimony = z.infer<typeof TestimonySchema>;

export const MeetingSchema = z.object({
    id: z.string(),
    partnerId: z.string(),
    partnerName: z.string(),
    date: z.any(),
    attendees: z.string(),
    type: z.enum(["Exploration", "Proposal", "Progress", "Problem", "Renewal"]),
    decisions: z.string().optional(),
    actionItems: z.array(z.string()).optional(),
    nextSteps: z.string(),
    createdAt: z.any(),
});
export type Meeting = z.infer<typeof MeetingSchema>;

export const HealthCheckSchema = z.object({
    id: z.string(),
    partnerId: z.string(),
    partnerName: z.string(),
    checkDate: z.any(),
    communication: z.number(),
    delivery: z.number(),
    alignment: z.number(),
    value: z.number(),
    issues: z.string().optional(),
    recommendation: z.enum(["Continue", "Improve", "Pause", "Terminate"]),
    nextReviewDate: z.string(),
    checkedBy: z.string(),
    createdAt: z.any(),
});
export type HealthCheck = z.infer<typeof HealthCheckSchema>;

export const TaskSchema = z.object({
    id: z.string(),
    title: z.string(),
    completed: z.boolean(),
    dueDate: z.any().optional(),
    createdAt: z.any()
});
export type Task = z.infer<typeof TaskSchema>;

export const EquipmentSchema = z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    status: z.enum(["Available", "In Use", "Under Maintenance"]),
    condition: z.enum(["Good", "Fair", "Poor"]),
    currentHolder: z.string(),
    purchaseDate: z.any().optional(),
    createdAt: z.any(),
});
export type Equipment = z.infer<typeof EquipmentSchema>;

export const ProposalSchema = z.object({
    id: z.string(),
    title: z.string(),
    partnerName: z.string(),
    amountRequested: z.number(),
    status: z.enum(["Draft", "Submitted", "In Review", "Approved", "Rejected"]),
    submissionDate: z.any(),
    decisionDate: z.any().optional(),
    createdAt: z.any(),
    conceptNote: z.string().optional(),
});
export type Proposal = z.infer<typeof ProposalSchema>;

export const PriorityItemSchema = z.object({
  activity: z.string(),
  priority: z.enum(['High', 'Medium', 'Low']),
  responsible: z.array(z.string()),
  deadline: z.any().optional(),
});
export type PriorityItem = z.infer<typeof PriorityItemSchema>;

export const TeamWeeklyPlanSchema = z.object({
    id: z.string(),
    weekOf: z.any(),
    keyPriorities: z.array(PriorityItemSchema),
    message: z.string(),
    authorId: z.string(),
    authorName: z.string(),
    status: z.enum(['Draft', 'Published']),
    createdAt: z.any(),
});
export type TeamWeeklyPlan = z.infer<typeof TeamWeeklyPlanSchema>;

export const WeeklyWorkplanSchema = z.object({
    id: z.string(),
    userId: z.string(),
    userName: z.string(),
    weekOf: z.any(),
    teamPlanId: z.string().optional(),
    teamPriorities: z.array(PriorityItemSchema).optional(),
    individualTasks: z.array(z.string()),
    createdAt: z.any(),
});
export type WeeklyWorkplan = z.infer<typeof WeeklyWorkplanSchema>;

export const RecentCheckoutSchema = CheckoutSchema;
export type RecentCheckout = z.infer<typeof RecentCheckoutSchema>;

export const KpiSchema = ImpactMetricSchema;
export type Kpi = ImpactMetric;

export const FinancialSummarySchema = z.object({
    budget: z.number(),
    spent: z.number(),
    income: z.number(),
    net: z.number(),
});
export type FinancialSummary = z.infer<typeof FinancialSummarySchema>;

export const TransactionSchema = z.object({
    id: z.string(),
    description: z.string(),
    amount: z.number(),
    date: z.any(),
    type: z.enum(['income', 'expense']),
});
export type Transaction = z.infer<typeof TransactionSchema>;

export const AlertInputSchema = AlertSchema.omit({id: true, createdAt: true, readBy: true});
export type AlertInput = z.infer<typeof AlertInputSchema>;

export const DailyPlannerAIInputSchema = z.object({
  userName: z.string(),
  userRole: z.string(),
  primaryMission: z.string(),
  weeklyPriorities: z.array(z.string()).optional(),
  keyResults: z.array(z.any()).optional(),
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
  ).optional(),
  materials: z.string().optional(),
  challenges: z.string().optional(),
  bestPractice: z.string().optional(),
});
export type DailyPlannerAIOutput = z.infer<typeof DailyPlannerAIOutputSchema>;

export const StrategicAdvisorInputSchema = z.object({
  activities: z.array(ActivitySchema),
  checkins: z.array(CheckinSchema),
  expenses: z.array(ExpenseSchema),
  keyResults: z.array(KeyResultSchema),
});
export type StrategicAdvisorInput = z.infer<typeof StrategicAdvisorInputSchema>;

export const StrategicAdvisorOutputSchema = z.object({
  insights: z.array(z.object({
    emoji: z.string(),
    title: z.string(),
    description: z.string(),
    recommendation: z.string()
  }))
})
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
  impactStory: z.string(),
});
export type ImpactStoryOutput = z.infer<typeof ImpactStoryOutputSchema>;

export const TestimonyInputSchema = z.object({
  mediaUri: z.string().url(),
});
export type TestimonyInput = z.infer<typeof TestimonyInputSchema>;

export const TestimonyOutputSchema = z.object({
    transcription: z.string(),
    summary: z.string(),
    quotes: z.array(z.string()),
    hashtags: z.array(z.string()),
});
export type TestimonyOutput = z.infer<typeof TestimonyOutputSchema>;


export const ParsePlanInputSchema = z.object({ planText: z.string() });
export type ParsePlanInput = z.infer<typeof ParsePlanInputSchema>;

export const ParsePlanOutputSchema = z.object({
    keyResults: z.array(KeyResultSchema.omit({id: true}))
});
export type ParsePlanOutput = z.infer<typeof ParsePlanOutputSchema>;


export const GenerateTemplateInputSchema = z.object({
  description: z.string(),
});
export type GenerateTemplateInput = z.infer<typeof GenerateTemplateInputSchema>;

export const GenerateTemplateOutputSchema = z.object({
  title: z.string(),
  checklistItems: z.array(z.string()),
});
export type GenerateTemplateOutput = z.infer<typeof GenerateTemplateOutputSchema>;

export const ParseWorkplanInputSchema = z.object({
  textPlan: z.string(),
});
export type ParseWorkplanInput = z.infer<typeof ParseWorkplanInputSchema>;

export const ParseWorkplanOutputSchema = z.object({
    keyPriorities: z.array(PriorityItemSchema),
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
    summary: z.string(),
    recurringSuccesses: z.array(z.string()),
    commonChallenges: z.array(z.string()),
    keyLearnings: z.array(z.string()),
});
export type QualitativeAnalysisOutput = z.infer<typeof QualitativeAnalysisOutputSchema>;

export const GrantFinderInputSchema = z.object({ query: z.string() });
export type GrantFinderInput = z.infer<typeof GrantFinderInputSchema>;

export const GrantFinderOutputSchema = z.object({
    opportunities: z.array(z.object({
        title: z.string(),
        funder: z.string(),
        description: z.string(),
        amount: z.number(),
        deadline: z.string(),
    }))
});
export type GrantFinderOutput = z.infer<typeof GrantFinderOutputSchema>;

export const GrantWriterInputSchema = z.object({
    proposalTitle: z.string(),
    partnerName: z.string(),
    amountRequested: z.string(),
});
export type GrantWriterInput = z.infer<typeof GrantWriterInputSchema>;

export const GrantWriterOutputSchema = z.object({
    conceptNote: z.string(),
});
export type GrantWriterOutput = z.infer<typeof GrantWriterOutputSchema>;


export const OmutoAIInputSchema = z.object({
  question: z.string(),
  history: z.any().optional(),
  userId: z.string(),
});
export type OmutoAIInput = z.infer<typeof OmutoAIInputSchema>;

export const OmutoAIOutputSchema = z.object({
  answer: z.string(),
});
export type OmutoAIOutput = z.infer<typeof OmutoAIOutputSchema>;

export const SmartRemindersInputSchema = z.object({
    userId: z.string(),
    userName: z.string(),
    userRole: z.string(),
});
export type SmartRemindersInput = z.infer<typeof SmartRemindersInputSchema>;

export const SmartRemindersOutputSchema = z.object({
    reminders: z.array(z.string()),
});
export type SmartRemindersOutput = z.infer<typeof SmartRemindersOutputSchema>;


export const SearchResultItemSchema = z.object({
  id: z.string(),
  collection: z.string(),
  title: z.string(),
  description: z.string(),
  url: z.string(),
});

// Duplicated from forms, but good to have here for reference if needed
export const OFATeamSchema = z.object({
  id: z.string(),
  teamName: z.string(),
  headCoachName: z.string().optional(),
  headCoachPhone: z.string().optional(),
  headCoachAttendance: z.string().optional(),
  headCoachAvailability: z.string().optional(),
  assistantCoachName: z.string().optional(),
  assistantCoachPhone: z.string().optional(),
  assistantCoachAttendance: z.string().optional(),
  assistantCoachAvailability: z.string().optional(),
  teamManagerName: z.string().optional(),
  teamManagerPhone: z.string().optional(),
  teamManagerAttendance: z.string().optional(),
  teamManagerAvailability: z.string().optional(),
  captainName: z.string().optional(),
  captainPhone: z.string().optional(),
  captainAttendance: z.string().optional(),
  viceCaptainName: z.string().optional(),
  viceCaptainPhone: z.string().optional(),
  viceCaptainAttendance: z.string().optional(),
  subcounty: z.string().optional(),
  parish: z.string().optional(),
  village: z.string().optional(),
  yearOfEstablishment: z.number().optional(),
  homePitchName: z.string().optional(),
  teamColours: z.string().optional(),
  motto: z.string().optional(),
  totalPlayers: z.number().optional(),
  u13: z.number().optional(),
  u15: z.number().optional(),
  u17: z.number().optional(),
  u19: z.number().optional(),
  percentageInSchool: z.number().optional(),
  mainAcademicChallenges: z.array(z.string()).optional(),
  enforceSchoolAttendance: z.string().optional(),
  trainingDaysPerWeek: z.number().optional(),
  avgTrainingAttendance: z.number().optional(),
  useWarmups: z.boolean().optional(),
  trackPlayerProgress: z.boolean().optional(),
  punctualityScore: z.number().optional(),
  disciplineScore: z.number().optional(),
  equipment: z.array(z.object({ item: z.string(), qty: z.number(), condition: z.string(), needLevel: z.string() })).optional(),
  needs: z.array(z.object({ area: z.string(), priority: z.number() })).optional(),
  communitySupport: z.string().optional(),
  parentEngagement: z.string().optional(),
  hasVolunteers: z.boolean().optional(),
  volunteerCount: z.number().optional(),
});
export type OFATeam = z.infer<typeof OFATeamSchema>;

export const OFAVolunteerSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  contact: z.string(),
});
export type OFAVolunteer = z.infer<typeof OFAVolunteerSchema>;

export const OFAMatchSchema = z.object({
  id: z.string(),
  date: z.string(),
  homeTeam: z.string(),
  awayTeam: z.string(),
  homeScore: z.number(),
  awayScore: z.number(),
  goalScorers: z.string().optional(),
});

export type OFAMatch = z.infer<typeof OFAMatchSchema>;

export const OFAPlayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  teamId: z.string(),
  teamName: z.string(),
  ageCategory: z.enum(['U13', 'U15', 'U17', 'U19']),
  photoUrl: z.string().url().optional().nullable(),
  playingPosition: z.enum(["Goalkeeper", "Defender", "Midfielder", "Forward"]).optional().nullable(),
  school: z.string().optional(),
  class: z.string().optional(),
  guardianContact: z.string().optional(),
  careerDream: z.string().optional(),
  skillGoal: z.string().optional(),
  schoolGoal: z.string().optional(),
  behaviourGoal: z.string().optional(),
  strengths: z.string().optional(),
  weaknesses: z.string().optional(),
  medicalConditions: z.string().optional(),
  schoolAttendance: z.enum(["Good", "Fair", "Poor", "Not Applicable"]).optional(),
  academicPerformance: z.enum(["Good", "Fair", "Poor", "Not Applicable"]).optional(),
});
export type OFAPlayer = z.infer<typeof OFAPlayerSchema>;

export const OFAPlayerFormData = OFAPlayerSchema.omit({id: true});
export type OFAPlayerFormData = z.infer<typeof OFAPlayerFormData>;


export const PulseContentSchema = z.object({
  id: z.string(),
  creatorName: z.string(),
  contentTitle: z.string(),
  format: z.enum(['Video', 'Podcast', 'Article', 'Photo']),
  link: z.string().url(),
  dateCreated: z.any(),
});
export type PulseContent = z.infer<typeof PulseContentSchema>;

export const WaterSourceSchema = z.object({
  id: z.string(),
  sourceName: z.string(),
  type: z.enum(['Borehole', 'Spring', 'Tap', 'Rainwater']),
  functional: z.boolean(),
});
export type WaterSource = z.infer<typeof WaterSourceSchema>;

export const WASH_AssessmentSchema = z.object({
  id: z.string(),
  school: z.string(),
  handwashingStations: z.number(),
  soapAvailable: z.boolean(),
  latrineCondition: z.enum(['Good', 'Fair', 'Poor']),
});
export type WASH_Assessment = z.infer<typeof WASH_AssessmentSchema>;


export const SchoolVisitSchema = z.object({
    id: z.string(),
    programId: z.string(),
    schoolName: z.string(),
    dateOfVisit: z.any(),
    objectivesMet: z.string(),
    userId: z.string(),
    userName: z.string(),
    createdAt: z.any(),
});
export type SchoolVisit = z.infer<typeof SchoolVisitSchema>;

export const PadsDistributionSchema = z.object({
    id: z.string(),
    date: z.any(),
    school: z.string(),
    numberOfPads: z.number(),
    girlsReached: z.number(),
    userId: z.string(),
    createdAt: z.any(),
});
export type PadsDistribution = z.infer<typeof PadsDistributionSchema>;

export const SLF_SchoolSchema = z.object({
    id: z.string(),
    schoolName: z.string(),
    headTeacherName: z.string(),
    contactTeacher: z.string(),
    enrollmentSize: z.number(),
    location: z.string(),
    createdAt: z.any(),
});
export type SLF_School = z.infer<typeof SLF_SchoolSchema>;

export const SLF_PrefectSchema = z.object({
    id: z.string(),
    schoolId: z.string(),
    schoolName: z.string(),
    name: z.string(),
    position: z.string(),
    age: z.number(),
    gender: z.enum(['Male', 'Female', 'Other']),
    createdAt: z.any(),
});
export type SLF_Prefect = z.infer<typeof SLF_PrefectSchema>;

export const PrefectPerformanceSchema = z.object({
  id: z.string(),
  prefectId: z.string(),
  prefectName: z.string(),
  month: z.string(),
  visibilityScore: z.number(),
  disciplineScore: z.number(),
  initiativeScore: z.number(),
});
export type PrefectPerformance = z.infer<typeof PrefectPerformanceSchema>;

export const BaselineSurveySchema = z.object({
    id: z.string(),
    beneficiaryId: z.string(),
    surveyDate: z.any(),
    skillLevel: z.number(),
    primaryChallenge: z.string(),
    programGoals: z.string(),
    createdAt: z.any(),
});
export type BaselineSurvey = z.infer<typeof BaselineSurveySchema>;

export const EndlineSurveySchema = z.object({
    id: z.string(),
    beneficiaryId: z.string(),
    surveyDate: z.any(),
    skillLevel: z.number(),
    changesNoticed: z.string(),
    satisfaction: z.number(),
    createdAt: z.any(),
});
export type EndlineSurvey = z.infer<typeof EndlineSurveySchema>;

export const YoSkillsCircleSchema = z.object({
    id: z.string(),
    circleName: z.string(),
    coach: z.string(),
    location: z.string(),
    membersCount: z.number(),
});
export type YoSkillsCircle = z.infer<typeof YoSkillsCircleSchema>;

export const YoSkillsYouthSchema = z.object({
    id: z.string(),
    circleId: z.string(),
    name: z.string(),
    age: z.number(),
    businessInterest: z.string(),
});
export type YoSkillsYouth = z.infer<typeof YoSkillsYouthSchema>;

export const BusinessProgressSchema = z.object({
    id: z.string(),
    businessIdeaId: z.string(),
    month: z.string(),
    monthlySales: z.number(),
});
export type BusinessProgress = z.infer<typeof BusinessProgressSchema>;

export const AttendanceRecordSchema = z.object({
    id: z.string(),
    eventName: z.string(),
    date: z.any(),
    participantName: z.string(),
    gender: z.enum(['Male', 'Female', 'Other']),
    age: z.number(),
    signature: z.boolean(),
    createdAt: z.any(),
});
export type AttendanceRecord = z.infer<typeof AttendanceRecordSchema>;

export const TreeSurvivalSurveySchema = z.object({
    id: z.string(),
    originalPlantingActivityId: z.string(),
    surveyDate: z.any(),
    numberOfTreesSurvived: z.number(),
    conditionOfTrees: z.enum(['Good', 'Fair', 'Poor']),
    userId: z.string(),
    userName: z.string(),
    createdAt: z.any(),
});
export type TreeSurvivalSurvey = z.infer<typeof TreeSurvivalSurveySchema>;


export const CustomerFeedbackSchema = z.object({
  id: z.string(),
  customer_name: z.string().optional(),
  date: z.string(),
  product_name: z.string(),
  rating: z.number().min(1).max(5),
  feedback: z.string().min(5),
  logged_by: z.string(),
});
export type CustomerFeedback = z.infer<typeof CustomerFeedbackSchema>;

export const MaterialPurchaseSchema = z.object({
  id: z.string(),
  material_id: z.string(),
  material_name: z.string(),
  quantity: z.number(),
  unit_cost: z.number(),
  total_cost: z.number(),
  supplier_name: z.string().optional(),
  purchase_date: z.string(),
  logged_by: z.string(),
});
export type MaterialPurchase = z.infer<typeof MaterialPurchaseSchema>;

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  categoryId: z.string(),
  sku: z.string(),
  description: z.string().optional(),
  unit: z.string(),
  default_selling_price: z.number().optional(),
  image_url: z.string().url().optional(),
  is_active: z.boolean(),
  type: z.enum(['finished', 'raw', 'packaging']),
  current_stock_quantity: z.number().optional(),
  reorder_level: z.number().optional(),
  supplierId: z.string().optional(),
  cost_per_unit: z.number().optional(),
  last_restocked_at: z.any().optional(),
  quantity_on_hand: z.number().optional(),
  location: z.string().optional(),
  createdAt: z.any(),
  updatedAt: z.any(),
});
export type Product = z.infer<typeof ProductSchema>;
export const ProductFormSchema = ProductSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type ProductFormData = z.infer<typeof ProductFormSchema>;
export type ProductCategory = { id: string; name: string; };

export const ProductionBatchFormSchema = z.object({
    batch_number: z.string().min(1, "Batch number is required"),
    productId: z.string().min(1, "Please select a product."),
    quantity_produced: z.coerce.number().min(1, "Quantity must be greater than 0."),
    production_date: z.string().min(1, "Production date is required."),
    supervisorId: z.string(),
    status: z.enum(["planned", "in-progress", "completed"]),
    notes: z.string().optional(),
    materials_used: z.array(z.object({
        material_id: z.string().min(1, "Select a material"),
        quantity_used: z.coerce.number().min(0.01, "Quantity must be positive")
    })).optional()
});
export type ProductionBatchFormData = z.infer<typeof ProductionBatchFormSchema>;

export const SaleFormSchema = z.object({
    transaction_number: z.string().optional(),
    customer_name: z.string().optional(),
    customer_phone: z.string().optional(),
    sale_date: z.string().min(1, "Sale date is required"),
    total_amount: z.number(),
    payment_method: z.enum(["Cash", "Mobile Money", "Bank Transfer"]),
    status: z.enum(["completed", "pending"]),
    items: z.array(z.object({
        product_id: z.string().min(1, "Product is required"),
        product_name: z.string(),
        quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
        unit_price: z.number(),
        total: z.number(),
    })).min(1, "At least one item is required."),
});
export type SaleFormData = z.infer<typeof SaleFormSchema>;


export const StockAdjustmentSchema = z.object({
    id: z.string(),
    product_id: z.string().min(1),
    product_name: z.string(),
    adjustment_date: z.any(),
    quantity: z.coerce.number().min(0.01, "Quantity must be greater than zero."),
    adjustment_type: z.enum(['Damage', 'Loss', 'Correction', 'Return']),
    reason: z.string().min(5, "A reason is required for adjustments."),
    logged_by: z.string(),
});
export type StockAdjustment = z.infer<typeof StockAdjustmentSchema>;

export const PrintingJobSchema = z.object({
  id: z.string(),
  jobNumber: z.string(),
  clientName: z.string(),
  clientPhone: z.string().optional(),
  pages_bw: z.number(),
  pages_color: z.number(),
  totalAmount: z.number(),
  paymentStatus: z.enum(['Paid', 'Partial', 'Unpaid']),
  jobDate: z.any(),
  operatorId: z.string(),
});
export type PrintingJob = z.infer<typeof PrintingJobSchema>;
export const PrintingJobFormSchema = PrintingJobSchema.omit({ id: true, jobNumber: true, operatorId: true });
export type PrintingJobFormData = z.infer<typeof PrintingJobFormSchema>;


export const SystemFeedbackSchema = z.object({
    id: z.string(),
    type: z.enum(['Bug', 'Feature', 'Feedback']),
    priority: z.enum(['High', 'Medium', 'Low']).optional(),
    title: z.string().min(5, "Please provide a short title."),
    description: z.string().min(15, "Please provide a detailed description."),
    reported_by: z.string(),
    status: z.enum(['New', 'In Progress', 'Resolved']),
    createdAt: z.any(),
});
export type SystemFeedback = z.infer<typeof SystemFeedbackSchema>;

export const SystemFeedbackFormDataSchema = SystemFeedbackSchema.omit({ id: true, createdAt: true, reported_by: true, status: true });
export type SystemFeedbackFormData = z.infer<typeof SystemFeedbackFormDataSchema>;

export const KnowledgeHubCTASchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    buttonLabel: z.string(),
});

export type KnowledgeHubCTA = z.infer<typeof KnowledgeHubCTASchema>;

export const SeedGrantApplicationSchema = z.object({
    id: z.string(),
    projectTitle: z.string(),
    applicantName: z.string(),
});
export type SeedGrantApplication = z.infer<typeof SeedGrantApplicationSchema>;

export const YAP_ChapterSchema = z.object({
    id: z.string(),
    chapterName: z.string(),
});
export type YAP_Chapter = z.infer<typeof YAP_ChapterSchema>;

export const BusinessIdeaSchema = z.object({
    id: z.string(),
    businessName: z.string(),
});
export type BusinessIdea = z.infer<typeof BusinessIdeaSchema>;

export type Checklist = any;
export type PlanGoal = any;
export type TeamMemberRole = any;
export type SuccessMetric = any;
export type StatCard = any;

export type Beneficiary = {
  id: string;
  name: string;
  dob: string;
  gender: string;
  village: string;
  programEnrolled: string;
  school?: string;
  phone?: string;
  guardianContact?: string;
  photoURL?: string | null;
  createdAt: Timestamp;
};

export type ProductionBatch = {
    id: string;
    batch_number: string;
    productId: string;
    quantity_produced: number;
    production_date: any;
    status: string;
}

export type InventoryCheck = {
    id: string;
    productName: string;
    date: any;
    countedQuantity: number;
}

export type KnowledgeHubSection = {
    id: string;
    title: string;
    summary: string;
    subsections: {
        title: string;
        summary: string;
    }[];
}

export type KnowledgeHubPitch = {
    id: string;
    title: string;
    summary: string;
}