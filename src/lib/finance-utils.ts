import type { Income, Expense } from './types/finance';

export const EXPENSE_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  DISBURSED: 'Disbursed',
  ACKNOWLEDGED: 'Acknowledged',
  REJECTED: 'Rejected',
} as const;

export const INCOME_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
} as const;

export function isExpenseActual(expense: Expense): boolean {
  return expense.status === EXPENSE_STATUS.ACKNOWLEDGED;
}

export function isExpensePending(expense: Expense): boolean {
  return expense.status === EXPENSE_STATUS.PENDING;
}

export function isExpenseApprovedNotDisbursed(expense: Expense): boolean {
  return expense.status === EXPENSE_STATUS.APPROVED;
}

export function isExpenseHeldByStaff(expense: Expense): boolean {
  return expense.status === EXPENSE_STATUS.DISBURSED;
}

export function isIncomeConfirmed(income: Income): boolean {
  return income.status === INCOME_STATUS.APPROVED;
}

export function isIncomePending(income: Income): boolean {
  return income.status === INCOME_STATUS.PENDING;
}

export function getActualExpenses(expenses: Expense[]): Expense[] {
  return expenses.filter(e => isExpenseActual(e));
}

export function getPendingExpenses(expenses: Expense[]): Expense[] {
  return expenses.filter(e => isExpensePending(e));
}

export function getApprovedNotDisbursed(expenses: Expense[]): Expense[] {
  return expenses.filter(e => isExpenseApprovedNotDisbursed(e));
}

export function getFundsHeldByStaff(expenses: Expense[]): Expense[] {
  return expenses.filter(e => isExpenseHeldByStaff(e) && e.type === 'Requisition');
}

export function getConfirmedIncome(income: Income[]): Income[] {
  return income.filter(i => isIncomeConfirmed(i));
}

export function getPendingIncome(income: Income[]): Income[] {
  return income.filter(i => isIncomePending(i));
}

export function calculateTotalSpent(expenses: Expense[]): number {
  return getActualExpenses(expenses).reduce((sum, e) => sum + Number(e.totalAmount || 0), 0);
}

export function calculateTotalIncome(income: Income[], confirmedOnly = false): number {
  const filtered = confirmedOnly ? getConfirmedIncome(income) : income;
  return filtered.reduce((sum, i) => sum + Number(i.amount || 0), 0);
}

export function calculateFundsHeldByStaff(expenses: Expense[]): number {
  return getFundsHeldByStaff(expenses).reduce((sum, e) => sum + Number(e.totalAmount || 0), 0);
}

export interface FinancialSnapshot {
  totalIncome: number;
  confirmedIncome: number;
  pendingIncome: number;
  totalSpent: number;
  fundsHeldByStaff: number;
  availableBalance: number;
  netBalance: number;
  pendingExpenses: number;
  approvedNotDisbursed: number;
}

export function calculateFinancialSnapshot(
  income: Income[],
  expenses: Expense[]
): FinancialSnapshot {
  const confirmedIncome = calculateTotalIncome(income, true);
  const pendingIncome = calculateTotalIncome(income.filter(i => isIncomePending(i)));
  const totalIncome = calculateTotalIncome(income);
  
  const totalSpent = calculateTotalSpent(expenses);
  const fundsHeldByStaff = calculateFundsHeldByStaff(expenses);
  const pendingExpenses = getPendingExpenses(expenses).reduce((sum, e) => sum + Number(e.totalAmount || 0), 0);
  const approvedNotDisbursed = getApprovedNotDisbursed(expenses).reduce((sum, e) => sum + Number(e.totalAmount || 0), 0);

  const availableBalance = confirmedIncome - totalSpent;
  const netBalance = totalIncome - totalSpent - fundsHeldByStaff;

  return {
    totalIncome,
    confirmedIncome,
    pendingIncome,
    totalSpent,
    fundsHeldByStaff,
    availableBalance,
    netBalance,
    pendingExpenses,
    approvedNotDisbursed,
  };
}

export interface StaffAccountabilitySummary {
  userId: string;
  userName: string;
  totalDisbursed: number;
  totalAccounted: number;
  balance: number;
  expenses: Expense[];
}

export function calculateStaffAccountabilities(expenses: Expense[]): StaffAccountabilitySummary[] {
  const staffMap = new Map<string, StaffAccountabilitySummary>();

  expenses
    .filter(e => e.type === 'Requisition' && e.status === EXPENSE_STATUS.DISBURSED)
    .forEach(e => {
      const existing = staffMap.get(e.userId);
      if (existing) {
        existing.totalDisbursed += Number(e.totalAmount || 0);
        existing.expenses.push(e);
      } else {
        staffMap.set(e.userId, {
          userId: e.userId,
          userName: e.userName,
          totalDisbursed: Number(e.totalAmount || 0),
          totalAccounted: 0,
          balance: 0,
          expenses: [e],
        });
      }
    });

  expenses
    .filter(e => e.type === 'Requisition' && e.status === EXPENSE_STATUS.ACKNOWLEDGED)
    .forEach(e => {
      const staff = staffMap.get(e.userId);
      if (staff) {
        staff.totalAccounted += Number(e.totalAmount || 0);
      }
    });

  staffMap.forEach(staff => {
    staff.balance = staff.totalDisbursed - staff.totalAccounted;
  });

  return Array.from(staffMap.values())
    .filter(s => s.balance > 0)
    .sort((a, b) => b.balance - a.balance);
}

export interface CategorySpending {
  name: string;
  spent: number;
  percent: number;
}

export function calculateSpendingByCategory(expenses: Expense[]): CategorySpending[] {
  const actualExpenses = getActualExpenses(expenses);
  const totalSpent = calculateTotalSpent(expenses);
  
  const categoryTotals: Record<string, number> = {};
  actualExpenses.forEach(e => {
    e.items?.forEach(item => {
      categoryTotals[item.category] = (categoryTotals[item.category] || 0) + Number(item.amount || 0);
    });
  });

  return Object.entries(categoryTotals)
    .map(([name, spent]) => ({
      name,
      spent,
      percent: totalSpent > 0 ? (spent / totalSpent) * 100 : 0,
    }))
    .sort((a, b) => b.spent - a.spent);
}
