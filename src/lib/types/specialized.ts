import { z } from 'zod';
import { Timestamp } from 'firebase-admin/firestore';

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
  district: z.string().optional(),
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
  visibilityScore: z.coerce.number(),
  disciplineScore: z.coerce.number(),
  initiativeScore: z.coerce.number(),
});
export type PrefectPerformance = z.infer<typeof PrefectPerformanceSchema>;

export const BaselineSurveySchema = z.object({
    id: z.string(),
    beneficiaryId: z.string(),
    surveyDate: z.any(),
    skillLevel: z.coerce.number(),
    primaryChallenge: z.string(),
    programGoals: z.string(),
    createdAt: z.any(),
});
export type BaselineSurvey = z.infer<typeof BaselineSurveySchema>;

export const EndlineSurveySchema = z.object({
    id: z.string(),
    beneficiaryId: z.string(),
    surveyDate: z.any(),
    skillLevel: z.coerce.number(),
    changesNoticed: z.string(),
    satisfaction: z.coerce.number(),
    createdAt: z.any(),
});
export type EndlineSurvey = z.infer<typeof EndlineSurveySchema>;

export const YoSkillsCircleSchema = z.object({
    id: z.string(),
    circleName: z.string(),
    coach: z.string(),
    location: z.string(),
    membersCount: z.coerce.number(),
});
export type YoSkillsCircle = z.infer<typeof YoSkillsCircleSchema>;

export const YoSkillsYouthSchema = z.object({
    id: z.string(),
    circleId: z.string(),
    name: z.string(),
    age: z.coerce.number(),
    businessInterest: z.string(),
});
export type YoSkillsYouth = z.infer<typeof YoSkillsYouthSchema>;

export const BusinessProgressSchema = z.object({
    id: z.string(),
    businessIdeaId: z.string(),
    month: z.string(),
    monthlySales: z.coerce.number(),
});
export type BusinessProgress = z.infer<typeof BusinessProgressSchema>;

export const AttendanceRecordSchema = z.object({
    id: z.string(),
    eventName: z.string(),
    date: z.any(),
    participantName: z.string(),
    gender: z.enum(['Male', 'Female', 'Other']),
    age: z.coerce.number(),
    signature: z.boolean(),
    userId: z.string(),
    userName: z.string().optional(),
    createdAt: z.any(),
    updatedAt: z.any().optional(),
});
export type AttendanceRecord = z.infer<typeof AttendanceRecordSchema>;

export const TreeSurvivalSurveySchema = z.object({
    id: z.string(),
    originalPlantingActivityId: z.string(),
    surveyDate: z.any(),
    numberOfTreesSurvived: z.coerce.number(),
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
  rating: z.coerce.number().min(1).max(5),
  feedback: z.string().min(5),
  logged_by: z.string(),
});
export type CustomerFeedback = z.infer<typeof CustomerFeedbackSchema>;

export const MaterialPurchaseSchema = z.object({
  id: z.string(),
  material_id: z.string(),
  material_name: z.string(),
  quantity: z.coerce.number(),
  unit_cost: z.coerce.number(),
  total_cost: z.coerce.number(),
  supplier_name: z.string().optional(),
  purchase_date: z.string(),
  logged_by: z.string(),
});
export type MaterialPurchase = z.infer<typeof MaterialPurchaseSchema>;

export const ProductionBatchSchema = z.object({
    id: z.string(),
    batch_number: z.string().min(1, "Batch number is required"),
    productId: z.string().min(1, "Please select a product."),
    quantity_produced: z.coerce.number().min(1, "Quantity must be greater than 0."),
    production_date: z.string().min(1, "Production date is required."),
    supervisorId: z.string(),
    status: z.enum(["planned", "in-progress", "completed"]),
    notes: z.string().optional(),
});
export type ProductionBatch = z.infer<typeof ProductionBatchSchema>;

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

export const InventoryCheckSchema = z.object({
    id: z.string(),
    productName: z.string(),
    date: z.any(),
    countedQuantity: z.coerce.number(),
});
// Checking original:
// 1050: export type InventoryCheck = {
// 1051:     id: string;
// 1052:     productName: string;
// 1053:     date: any;
// 1054:     countedQuantity: number;
// 1055: }

export type InventoryCheck = {
    id: string;
    productName: string;
    date: any;
    countedQuantity: number;
}

export const PrintingJobSchema = z.object({
  id: z.string(),
  jobNumber: z.string(),
  clientName: z.string(),
  clientPhone: z.string().optional(),
  pages_bw: z.coerce.number(),
  pages_color: z.coerce.number(),
  totalAmount: z.coerce.number(),
  paymentStatus: z.enum(['Paid', 'Partial', 'Unpaid']),
  jobDate: z.any(),
  operatorId: z.string(),
});
export type PrintingJob = z.infer<typeof PrintingJobSchema>;
export const PrintingJobFormSchema = PrintingJobSchema.omit({ id: true, jobNumber: true, operatorId: true });
export type PrintingJobFormData = z.infer<typeof PrintingJobFormSchema>;

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

export type PlanGoal = any;
export type SuccessMetric = any;
export type StatCard = any;

export type Beneficiary = {
  id: string;
  name: string;
  dob: string;
  gender: string;
  district: string;
  subcounty: string;
  parish: string;
  village: string;
  programEnrolled: string;
  school?: string;
  phone?: string;
  guardianContact?: string;
  photoURL?: string | null;
  userId: string;
  userName?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
};

export const EquipmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  status: z.enum(["Available", "In Use", "Under Maintenance"]),
  condition: z.enum(["Good", "Fair", "Poor"]),
  currentHolder: z.string(),
  purchaseDate: z.string().optional(),
  createdAt: z.any().optional(),
});
export type Equipment = z.infer<typeof EquipmentSchema>;

export const SchoolXperienceSchema = z.object({
  id: z.string(),
  schoolName: z.string().min(3, 'School name is required'),
  location: z.string().min(2, 'Location is required'),
  subCounty: z.string().optional(),
  district: z.string().optional(),
  patronTeacher: z.string().min(3, 'Patron teacher name is required'),
  patronPhone: z.string().optional(),
  patronEmail: z.string().email().optional().or(z.literal('')),
  headTeacher: z.string().optional(),
  enrollmentSize: z.coerce.number().min(1).optional(),
  tier: z.enum(['Partner', 'Active', 'Advanced', 'Flagship']).default('Partner'),
  status: z.enum(['Registered', 'Launched', 'Active', 'Completed', 'Inactive']).default('Registered'),
  activeProgrammes: z.array(z.enum(['SLF', 'RED', 'GreenSchools', 'PureWater'])).default([]),
  term: z.enum(['Term 1', 'Term 2', 'Term 3']).default('Term 1'),
  academicYear: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.any(),
  createdBy: z.string(),
  updatedAt: z.any().optional(),
});
export type SchoolXperience = z.infer<typeof SchoolXperienceSchema>;

export const SchoolVisitXperienceSchema = z.object({
  id: z.string(),
  schoolId: z.string(),
  schoolName: z.string(),
  date: z.string(),
  visitor: z.string(),
  programmesCovered: z.array(z.enum(['SLF', 'RED', 'GreenSchools', 'PureWater'])),
  objectivesMet: z.string().min(10, 'Please describe objectives met'),
  challengesObserved: z.string().optional(),
  teacherFeedback: z.string().optional(),
  studentFeedback: z.string().optional(),
  followUpActions: z.string().optional(),
  flagForStory: z.boolean().default(false),
  photos: z.array(z.string()).optional(),
  createdAt: z.any(),
  createdBy: z.string(),
});
export type SchoolVisitXperience = z.infer<typeof SchoolVisitXperienceSchema>;

export const SchoolScorecardSchema = z.object({
  id: z.string(),
  schoolId: z.string(),
  schoolName: z.string(),
  term: z.enum(['Term 1', 'Term 2', 'Term 3']),
  academicYear: z.string(),
  month: z.string(),
  attendanceScore: z.coerce.number().min(1).max(5),
  activitiesCompleted: z.coerce.number().min(1).max(5),
  studentEngagement: z.coerce.number().min(1).max(5),
  teacherSupport: z.coerce.number().min(1).max(5),
  overallScore: z.number().optional(),
  rating: z.enum(['Red', 'Amber', 'Green']).optional(),
  notes: z.string().optional(),
  createdAt: z.any(),
  createdBy: z.string(),
});
export type SchoolScorecard = z.infer<typeof SchoolScorecardSchema>;

export const SchoolLeaderSchema = z.object({
  id: z.string(),
  schoolId: z.string(),
  name: z.string().min(2, 'Name is required'),
  role: z.string(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  year: z.string().optional(),
  contact: z.string().optional(),
  createdAt: z.any(),
});
export type SchoolLeader = z.infer<typeof SchoolLeaderSchema>;

export const SchoolProgrammeActivitySchema = z.object({
  id: z.string(),
  schoolId: z.string(),
  schoolName: z.string(),
  programme: z.enum(['SLF', 'RED', 'GreenSchools', 'PureWater']),
  activityType: z.string(),
  description: z.string().optional(),
  date: z.string(),
  studentsReached: z.coerce.number().optional(),
  notes: z.string().optional(),
  createdAt: z.any(),
  createdBy: z.string(),
});
export type SchoolProgrammeActivity = z.infer<typeof SchoolProgrammeActivitySchema>;
