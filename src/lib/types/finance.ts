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
    notes: z.string().optional(),
});

export type Expense = z.infer<typeof ExpenseSchema>;

export const IncomeSchema = z.object({
    id: z.string(),
    source: z.string(),
    amount: z.coerce.number(),
    dateReceived: z.any(),
    type: z.string(),
    notes: z.string().optional(),
    status: z.enum(['Pending', 'Approved', 'Rejected']).default('Approved'),
    projectId: z.string().optional(),
    projectName: z.string().optional(),
    donorName: z.string().optional(),
    restricted: z.boolean().default(false),
    receiptUrl: z.string().optional(),
    createdAt: z.any(),
});

export type Income = z.infer<typeof IncomeSchema>;

export const FinancialSummarySchema = z.object({
    budget: z.coerce.number(),
    spent: z.coerce.number(),
    income: z.coerce.number(),
    net: z.coerce.number(),
});

export type FinancialSummary = z.infer<typeof FinancialSummarySchema>;

export const TransactionSchema = z.object({
    id: z.string(),
    description: z.string(),
    amount: z.coerce.number(),
    date: z.any(),
    type: z.enum(['income', 'expense']),
});

export type Transaction = z.infer<typeof TransactionSchema>;

export const RecurrenceFrequencySchema = z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']);

export type RecurrenceFrequency = z.infer<typeof RecurrenceFrequencySchema>;

export const RecurringExpenseSchema = z.object({
    id: z.string(),
    userId: z.string(),
    description: z.string(),
    category: z.enum(expenseItemCategories),
    amount: z.coerce.number(),
    frequency: RecurrenceFrequencySchema,
    startDate: z.any(),
    endDate: z.any().optional(),
    nextDueDate: z.any(),
    isActive: z.boolean().default(true),
    projectId: z.string().optional(),
    projectName: z.string().optional(),
    createdAt: z.any(),
});

export type RecurringExpense = z.infer<typeof RecurringExpenseSchema>;

export const FiscalYearSchema = z.object({
    id: z.string(),
    name: z.string(),
    startDate: z.any(),
    endDate: z.any(),
    isActive: z.boolean().default(true),
    createdAt: z.any(),
});

export type FiscalYear = z.infer<typeof FiscalYearSchema>;

export const BudgetPeriodSchema = z.object({
    id: z.string(),
    name: z.string(),
    fiscalYearId: z.string().optional(),
    startDate: z.any(),
    endDate: z.any(),
    totalBudget: z.coerce.number(),
    categoryLimits: z.record(z.coerce.number()).optional(),
    isActive: z.boolean().default(true),
    createdAt: z.any(),
});

export type BudgetPeriod = z.infer<typeof BudgetPeriodSchema>;

export const BankAccountSchema = z.object({
    id: z.string(),
    name: z.string(),
    accountNumber: z.string().optional(),
    bankName: z.string(),
    currency: z.enum(['UGX', 'USD', 'EUR']).default('UGX'),
    openingBalance: z.coerce.number().default(0),
    currentBalance: z.coerce.number().default(0),
    isActive: z.boolean().default(true),
    createdAt: z.any(),
});

export type BankAccount = z.infer<typeof BankAccountSchema>;

export const PettyCashFloatSchema = z.object({
    id: z.string(),
    custodianId: z.string(),
    custodianName: z.string(),
    floatAmount: z.coerce.number(),
    currentBalance: z.coerce.number(),
    lastReplenished: z.any(),
    createdAt: z.any(),
});

export type PettyCashFloat = z.infer<typeof PettyCashFloatSchema>;

export const generateNextDueDate = (
    currentDate: Date,
    frequency: RecurrenceFrequency
): Date => {
    const next = new Date(currentDate);
    
    switch (frequency) {
        case 'daily':
            next.setDate(next.getDate() + 1);
            break;
        case 'weekly':
            next.setDate(next.getDate() + 7);
            break;
        case 'monthly':
            next.setMonth(next.getMonth() + 1);
            break;
        case 'quarterly':
            next.setMonth(next.getMonth() + 3);
            break;
        case 'yearly':
            next.setFullYear(next.getFullYear() + 1);
            break;
    }
    
    return next;
};
