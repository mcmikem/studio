import type { Income, Expense, FiscalYear, BudgetPeriod, BankAccount, PettyCashFloat } from './types/finance';

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
  // If no status field exists, treat as confirmed (backwards compatibility)
  // Otherwise, only 'Approved' status counts as confirmed
  return !income.status || income.status === INCOME_STATUS.APPROVED;
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

export function getActiveFiscalYear(fiscalYears: FiscalYear[]): FiscalYear | undefined {
  return fiscalYears.find(fy => fy.isActive);
}

export function getCurrentFiscalYear(): { name: string; start: Date; end: Date } {
  const now = new Date();
  const month = now.getMonth();
  let year = now.getFullYear();
  
  if (month >= 9) {
    return {
      name: `FY ${year}-${year + 1}`,
      start: new Date(year, 9, 1),
      end: new Date(year + 1, 8, 30),
    };
  }
  return {
    name: `FY ${year - 1}-${year}`,
    start: new Date(year - 1, 9, 1),
    end: new Date(year, 8, 30),
  };
}

export function filterByFiscalYear<T extends { dateReceived?: any; date?: any; createdAt?: any }>(
  items: T[],
  fiscalYear: FiscalYear
): T[] {
  const start = fiscalYear.startDate?.toDate?.() || new Date(fiscalYear.startDate);
  const end = fiscalYear.endDate?.toDate?.() || new Date(fiscalYear.endDate);
  
  return items.filter(item => {
    const date = item.dateReceived?.toDate?.() || item.date?.toDate?.() || item.createdAt?.toDate?.() || new Date();
    return date >= start && date <= end;
  });
}

export function filterByBudgetPeriod<T extends { date?: any; dateReceived?: any }>(
  items: T[],
  period: BudgetPeriod
): T[] {
  const start = period.startDate?.toDate?.() || new Date(period.startDate);
  const end = period.endDate?.toDate?.() || new Date(period.endDate);
  
  return items.filter(item => {
    const date = item.date?.toDate?.() || item.dateReceived?.toDate?.() || new Date();
    return date >= start && date <= end;
  });
}

export interface BudgetUtilization {
  category: string;
  budgeted: number;
  spent: number;
  variance: number;
  percentUsed: number;
}

export function calculateBudgetUtilization(
  budget: BudgetPeriod,
  actualExpenses: Expense[]
): BudgetUtilization[] {
  const categoryBudgets = budget.categoryLimits || {};
  const periodExpenses = filterByBudgetPeriod(actualExpenses, budget);
  const spentByCategory: Record<string, number> = {};
  
  periodExpenses.forEach(e => {
    if (e.status === 'Acknowledged') {
      e.items?.forEach(item => {
        spentByCategory[item.category] = (spentByCategory[item.category] || 0) + Number(item.amount || 0);
      });
    }
  });
  
  const allCategories = new Set([...Object.keys(categoryBudgets), ...Object.keys(spentByCategory)]);
  
  return Array.from(allCategories).map(category => {
    const budgeted = categoryBudgets[category] || 0;
    const spent = spentByCategory[category] || 0;
    return {
      category,
      budgeted,
      spent,
      variance: budgeted - spent,
      percentUsed: budgeted > 0 ? (spent / budgeted) * 100 : 0,
    };
  }).sort((a, b) => b.percentUsed - a.percentUsed);
}

export function calculateCashOnHand(
  bankAccounts: BankAccount[],
  pettyCashFloats: PettyCashFloat[]
): number {
  const bankTotal = bankAccounts.reduce((sum, acc) => sum + Number(acc.currentBalance || 0), 0);
  const pettyTotal = pettyCashFloats.reduce((sum, fc) => sum + Number(fc.currentBalance || 0), 0);
  return bankTotal + pettyTotal;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export function calculateMonthlyTrends(
  income: Income[],
  expenses: Expense[],
  months: number = 12
): MonthlyTrend[] {
  const now = new Date();
  const trends: MonthlyTrend[] = [];
  
  for (let i = months - 1; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const monthName = monthDate.toLocaleString('default', { month: 'short', year: '2-digit' });
    
    const monthIncome = income
      .filter(inc => {
        const d = inc.dateReceived?.toDate?.() || new Date(inc.dateReceived);
        return d >= monthDate && d <= monthEnd && (!inc.status || inc.status === 'Approved');
      })
      .reduce((sum, inc) => sum + Number(inc.amount || 0), 0);
    
    const monthExpenses = expenses
      .filter(exp => {
        const d = exp.date?.toDate?.() || new Date(exp.date);
        return d >= monthDate && d <= monthEnd && exp.status === 'Acknowledged';
      })
      .reduce((sum, exp) => sum + Number(exp.totalAmount || 0), 0);
    
    trends.push({
      month: monthName,
      income: monthIncome,
      expenses: monthExpenses,
      net: monthIncome - monthExpenses,
    });
  }
  
  return trends;
}
