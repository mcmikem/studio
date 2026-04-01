import { z } from 'zod';

// Common schemas
export const idSchema = z.string().uuid().or(z.string().length(28)); // Firestore IDs are 28 chars
export const nonEmptyString = z.string().min(1, 'Field is required');
export const positiveInt = z.number().int().positive('Must be a positive integer');
export const nonNegativeInt = z.number().int().nonnegative('Must be a non-negative integer');
export const dateString = z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid date format' });

// Alert input schema
export const alertInputSchema = z.object({
  type: z.enum(['Info', 'Warning', 'Urgent']),
  priority: z.enum(['Low', 'Medium', 'High']),
  message: nonEmptyString.max(500),
  targetUserIds: z.array(idSchema).optional().default([]),
  action: z.string().optional(),
});

// Testimony input schema
export const testimonyInputSchema = z.object({
  title: nonEmptyString.max(200),
  description: z.string().max(2000),
  // Add other fields as needed
});

// Beneficiary input schema
export const beneficiaryInputSchema = z.object({
  firstName: nonEmptyString.max(50),
  lastName: nonEmptyString.max(50),
  dateOfBirth: dateString.optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  phone: z.string().regex(/^\+?256\d{9}$/, 'Invalid Uganda phone number').optional(),
  email: z.string().email().optional(),
  program: z.string().max(100).optional(),
  // Add other fields as needed
});

// Expense input schema
export const expenseInputSchema = z.object({
  title: nonEmptyString.max(200),
  amount: positiveInt.max(1000000, 'Amount too large'),
  date: dateString,
  project: nonEmptyString.max(100),
  lineItems: z.array(z.object({
    description: nonEmptyString.max(200),
    category: z.enum(['transport', 'accommodation', 'food', 'materials', 'other']),
    amount: positiveInt,
  })).min(1, 'At least one line item required'),
  receiptUrl: z.string().url().optional(),
  submittedFor: z.enum(['personal', 'project', 'program']).default('personal'),
});

// Leave request schema
export const leaveRequestSchema = z.object({
  leaveType: z.enum(['annual', 'sick', 'maternity', 'paternity', 'compassionate', 'study']),
  startDate: dateString,
  endDate: dateString,
  reason: nonEmptyString.max(500),
  // Add other fields as needed
});

// Daily planner AI input schema
export const dailyPlannerAIInputSchema = z.object({
  primaryMission: nonEmptyString.max(200),
  mood: z.enum(['good', 'neutral', 'bad']),
  workingStartTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format HH:MM'),
  workingEndTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format HH:MM'),
  // details will be validated by the AI output schema
});

// Smart reminders input schema
export const smartRemindersInputSchema = z.object({
  userId: idSchema,
  // Add other fields as needed
});

// Grant finder input schema
export const grantFinderInputSchema = z.object({
  keyword: z.string().optional(),
  maxResults: z.number().int().min(1).max(50).default(10),
  // Add other fields as needed
});

// Generate template input schema
export const generateTemplateInputSchema = z.object({
  templateType: z.enum(['email', 'sms', 'letter']),
  data: z.record(z.string(), z.string().optional()), // Flexible data
});

// Define output schemas as well for consistency
export const dailyPlannerAIOutputSchema = z.object({
  timeBlocks: z.array(z.object({
    startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
    endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
    description: z.string().max(200),
  })),
  strategicAlignments: z.array(z.string()),
  focusAreas: z.array(z.string().max(100)),
  energyLevels: z.array(z.enum(['high', 'medium', 'low'])),
});

export const smartRemindersOutputSchema = z.object({
  reminders: z.array(z.string()),
  suggestions: z.array(z.string()),
});

export const grantFinderOutputSchema = z.object({
  grants: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    amount: z.number(),
    deadline: z.string(),
    eligibility: z.string(),
    link: z.string().url().optional(),
  })),
  totalCount: z.number(),
});

export const generateTemplateOutputSchema = z.object({
  template: z.string(),
  subject: z.string(),
});