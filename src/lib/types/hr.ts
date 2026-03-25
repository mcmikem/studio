import { z } from 'zod';

export const LeaveTypeSchema = z.enum(['Annual', 'Sick', 'Maternity', 'Paternity', 'Study', 'Unpaid', 'Compassionate', 'Other']);
export type LeaveType = z.infer<typeof LeaveTypeSchema>;

export const LeaveStatusSchema = z.enum(['Pending', 'Approved', 'Rejected', 'Cancelled']);
export type LeaveStatus = z.infer<typeof LeaveStatusSchema>;

export const LeaveRequestSchema = z.object({
    id: z.string(),
    userId: z.string(),
    userName: z.string(),
    type: LeaveTypeSchema,
    startDate: z.any(), // Timestamp
    endDate: z.any(),   // Timestamp
    reason: z.string(),
    status: LeaveStatusSchema,
    approvedBy: z.string().optional(),
    approvedByName: z.string().optional(),
    createdAt: z.any(),
    days: z.number(),
});

export type LeaveRequest = z.infer<typeof LeaveRequestSchema>;

export const PayrollStatusSchema = z.enum(['Draft', 'Pending Approval', 'Approved', 'Paid']);
export type PayrollStatus = z.infer<typeof PayrollStatusSchema>;

export const PayrollRecordSchema = z.object({
    id: z.string(),
    userId: z.string(),
    userName: z.string(),
    month: z.number(), // 1-12
    year: z.number(),
    basicSalary: z.number(),
    allowances: z.number().default(0),
    deductions: z.number().default(0),
    netPay: z.number(),
    status: PayrollStatusSchema,
    createdAt: z.any(),
});

export type PayrollRecord = z.infer<typeof PayrollRecordSchema>;

export const EmployeeAssetSchema = z.object({
    id: z.string(),
    name: z.string(),
    serialNumber: z.string().optional(),
    condition: z.string(),
    assignedDate: z.any(),
});

export type EmployeeAsset = z.infer<typeof EmployeeAssetSchema>;
