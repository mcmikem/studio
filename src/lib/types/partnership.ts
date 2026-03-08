import { z } from 'zod';

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
