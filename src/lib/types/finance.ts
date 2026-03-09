import { z } from 'zod';

export const expenseItemCategories = ["Transport", "Rent", "Office Dev't", "Projects", "Stationery", "Registration", "Meetings", "Media", "Fuel", "Printing & Photocopy", "Phone", "Food", "Mobile Money Charges", "IGA Expense", "Allowances and Stipends", "Kibanja", "Professional Services", "community support", "miscellaneous", "Withdraw", "Raw Materials"] as const;

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
    receiptUrl: z.string().optional(),
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
