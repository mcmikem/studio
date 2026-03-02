import { z } from 'zod';

// src/lib/types.ts
export type Project = {
  id: string;
  name: string;
  partner?: string;
  districts?: string;
  participants?: number;
  attendanceRate?: number;
  learningImprovement?: number;
  adoptionRate?: number;
  status?: string;
  startDate?: any;
  endDate?: any;
  manager?: string;
  completion?: number;
  nextMilestone?: string;
};

export type Partnership = {
  id: string;
  name: string;
  type?: string;
  contactPerson?: string;
  contactEmail?: string;
  health?: string;
  status?: string;
  contactRole?: string;
  contactPhone?: string;
  focusAreas?: string[];
  offers?: string[];
  receives?: string[];
  strategicFit?: number;
  resourcePotential?: number;
  riskLevel?: number;
  priority?: string;
  lastContacted?: any;
  nextStep?: string;
  nextActionDate?: any;
  schoolDetails?: any;
};

// Enterprise / products
export type Product = { id: string; productName: string, type?: string, default_selling_price?: number, cost_per_unit?: number, quantity_on_hand?: number, current_stock_quantity?: number, name?: string, unit?: string };
export type ProductionBatch = { id: string, production_date?: any, productId?: string, batch_number?: string, quantity_produced?: number };
export type InventoryCheck = { id: string, date?: any, productName?: string, countedQuantity?: number };

// OFA
export type OFATeam = { id: string; teamName: string, headCoachName?: string, headCoachPhone?: string, headCoachAttendance?: number, headCoachAvailability?: string, assistantCoachName?: string, assistantCoachPhone?: string, assistantCoachAttendance?: number, assistantCoachAvailability?: string, teamManagerName?: string, teamManagerPhone?: string, teamManagerAttendance?: number, teamManagerAvailability?: string, captainName?: string, captainPhone?: string, captainAttendance?: number, viceCaptainName?: string, viceCaptainPhone?: string, viceCaptainAttendance?: number, subcounty?: string, parish?: string, village?: string, yearOfEstablishment?: number, homePitchName?: string, teamColours?: string, motto?: string, totalPlayers?: number, u13?: number, u15?: number, u17?: number, u19?: number, percentageInSchool?: number, mainAcademicChallenges?: string, enforceSchoolAttendance?: boolean, trainingDaysPerWeek?: number, avgTrainingAttendance?: number, useWarmups?: boolean, trackPlayerProgress?: boolean, punctualityScore?: number, disciplineScore?: number, equipment?: any[], needs?: any[], communitySupport?: string, parentEngagement?: string, hasVolunteers?: boolean, volunteerCount?: number };
export type OFAVolunteer = { id: string; name: string, role?: string, contact?: string };

// YAP
export type YAP_Chapter = { id: string; chapterName: string, leader?: string, location?: string, membersCount?: number };
export type YAP_Report = { id: string, month?: any, activities?: string, attendance?: number };
export type SeedGrantApplication = { id: string; projectTitle: string; applicantName: string, amountRequested?: number };

// YoSkills
export type BusinessIdea = { id: string; businessName: string, problemSolved?: string, startupCapitalNeeded?: number };

// Printing / others
export type PrintingJob = { id: string, jobDate?: any, totalAmount?: number, paymentStatus?: string };

// System feedback
export type SystemFeedbackFormData = { id?: string, type?: string, priority?: string, title?: string, description?: string };

export type AlertInput = any;
export type DailyPlannerAIInput = any;
export type DailyPlannerAIOutput = any;
export type StrategicAdvisorInput = any;
export type StrategicAdvisorOutput = any;
export type ImpactStoryInput = any;
export type ImpactStoryOutput = any;
export type TestimonyInput = any;
export type TestimonyOutput = any;
export type ParsePlanInput = any;
export type ParsePlanOutput = any;
export type GenerateTemplateInput = any;
export type GenerateTemplateOutput = any;
export type ParseWorkplanInput = any;
export type ParseWorkplanOutput = any;
export type QualitativeAnalysisInput = any;
export type QualitativeAnalysisOutput = any;
export type GrantFinderInput = any;
export type GrantFinderOutput = any;
export type OmutoAIInput = any;
export type OmutoAIOutput = any;
export type SmartRemindersInput = any;
export type SmartRemindersOutput = any;
export const AlertInputSchema = z.object({});
export const DailyPlannerAIInputSchema = z.object({});
export const DailyPlannerAIOutputSchema = z.object({});
export const GenerateTemplateInputSchema = z.object({});
export const GenerateTemplateOutputSchema = z.object({});
export const GrantFinderInputSchema = z.object({});
export const GrantFinderOutputSchema = z.object({});
export const GrantWriterInputSchema = z.object({});
export const GrantWriterOutputSchema = z.object({});
export const ImpactStoryInputSchema = z.object({});
export const ImpactStoryOutputSchema = z.object({});
export const SearchResultItemSchema = z.object({});
export const OmutoAIInputSchema = z.object({});
export const OmutoAIOutputSchema = z.object({});
export const ParsePlanInputSchema = z.object({});
export const ParsePlanOutputSchema = z.object({});
export const ParseWorkplanInputSchema = z.object({});
export const ParseWorkplanOutputSchema = z.object({});
export const QualitativeAnalysisInputSchema = z.object({});
export const QualitativeAnalysisOutputSchema = z.object({});
export const SmartRemindersInputSchema = z.object({});
export const SmartRemindersOutputSchema = z.object({});
export const TestimonyInputSchema = z.object({});
export const TestimonyOutputSchema = z.object({});
export type ProjectParticipant = any;
export type ProjectParticipantFormData = any;
export const ProjectParticipantFormSchema = z.object({});
export type Activity = any;
export type CalendarEvent = any;
export type Message = any;
export type Checkin = any;
export type TaskTemplate = any;
export type KeyResult = any;
export type Sale = any;
export type Beneficiary = any;
export type KnowledgeHubSection = any;
export type KnowledgeHubPitch = any;
export type KnowledgeHubFAQ = any;
export type KnowledgeHubStory = any;
export type KnowledgeHubCTA = any;
export type Testimony = any;
export type Equipment = any;
export type Expense = any;
export type User = any;
export type Income = any;
export type ExpenseItem = any;
export const expenseItemCategories = [];
export type ImpactMetric = any;
export type Meeting = any;
export type HealthCheck = any;
export type Program = any;
export type Proposal = any;
export type TeamWeeklyPlan = any;
export type PriorityItem = any;
export type AttendanceRecord = any;
export type TreeSurvivalSurvey = any;
export type OFAMatch = any;
export type OFAPlayer = any;
export type PulseContent = any;
export type WaterSource = any;
export type WASH_Assessment = any;
export type SchoolVisit = any;
export type PadsDistribution = any;
export type SLF_School = any;
export type SLF_Prefect = any;
export type PrefectPerformance = any;
export type BaselineSurvey = any;
export type EndlineSurvey = any;
export type YoSkillsCircle = any;
export type BusinessProgress = any;
export type Checkout = any;
export type WeeklyWorkplan = any;
export type RecentCheckout = any;
export type Task = any;
export type Alert = any;
export const CustomerFeedbackSchema = z.object({});
export type CustomerFeedback = any;
export const MaterialPurchaseSchema = z.object({});
export type MaterialPurchase = any;
export const ProductFormSchema = z.object({});
export type ProductFormData = any;
export type ProductCategory = any;
export const ProductionBatchFormSchema = z.object({});
export type ProductionBatchFormData = any;
export const SaleFormSchema = z.object({});
export type SaleFormData = any;
export const StockAdjustmentSchema = z.object({});
export type StockAdjustment = any;
export const PartnershipSchema = z.object({});
export const SystemFeedbackSchema = z.object({});
export type YoSkillsYouth = any;
export const PrintingJobFormSchema = z.object({});
export type PrintingJobFormData = any;
export type Checklist = any;
export type PlanGoal = any;
export type TeamMemberRole = any;
export type SuccessMetric = any;
export type StatCard = any;

export type Kpi = {
  metric: string;
  target: number;
  current: number;
  unit: string;
  valuePerUnit: number;
};

export type FinancialSummary = {
  budget: number;
  spent: number;
  income: number;
  net: number;
};

export type Transaction = {
  id: string;
  description: string;
  amount: number;
  date: any;
  type: 'income' | 'expense';
};