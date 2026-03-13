import { z } from 'zod';

export const BudgetAlertThresholdSchema = z.object({
  id: z.string().optional(),
  category: z.string(),
  budgetAmount: z.number(),
  warningThreshold: z.number().min(0).max(100).default(80),
  criticalThreshold: z.number().min(0).max(100).default(95),
  enabled: z.boolean().default(true),
});

export type BudgetAlertThreshold = z.infer<typeof BudgetAlertThresholdSchema>;

export type AlertLevel = 'warning' | 'critical' | 'ok';

export interface BudgetAlert {
  level: AlertLevel;
  category: string;
  spent: number;
  budget: number;
  percentage: number;
  message: string;
}

export function calculateBudgetAlert(
  spent: number,
  budget: number,
  warningThreshold: number = 80,
  criticalThreshold: number = 95
): BudgetAlert {
  if (budget <= 0) {
    return {
      level: 'ok',
      category: '',
      spent,
      budget,
      percentage: 0,
      message: 'No budget set',
    };
  }

  const percentage = (spent / budget) * 100;

  if (percentage >= criticalThreshold) {
    return {
      level: 'critical',
      category: '',
      spent,
      budget,
      percentage,
      message: `Critical: Budget ${percentage.toFixed(1)}% exhausted (UGX ${spent.toLocaleString()} of ${budget.toLocaleString()})`,
    };
  }

  if (percentage >= warningThreshold) {
    return {
      level: 'warning',
      category: '',
      spent,
      budget,
      percentage,
      message: `Warning: Budget ${percentage.toFixed(1)}% used (UGX ${spent.toLocaleString()} of ${budget.toLocaleString()})`,
    };
  }

  return {
    level: 'ok',
    category: '',
    spent,
    budget,
    percentage,
    message: `Budget ${percentage.toFixed(1)}% used (UGX ${spent.toLocaleString()} of ${budget.toLocaleString()})`,
  };
}

export function checkBudgetAlerts(
  expenses: { category: string; amount: number }[],
  thresholds: BudgetAlertThreshold[]
): BudgetAlert[] {
  const alerts: BudgetAlert[] = [];

  for (const threshold of thresholds) {
    if (!threshold.enabled) continue;

    const categoryExpenses = expenses.filter(
      e => e.category.toLowerCase() === threshold.category.toLowerCase()
    );
    const spent = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);

    const alert = calculateBudgetAlert(
      spent,
      threshold.budgetAmount,
      threshold.warningThreshold,
      threshold.criticalThreshold
    );
    alert.category = threshold.category;
    alerts.push(alert);
  }

  return alerts;
}

export const defaultThresholds: BudgetAlertThreshold[] = [
  { category: 'Transport', budgetAmount: 500000, warningThreshold: 80, criticalThreshold: 95, enabled: true },
  { category: 'Projects', budgetAmount: 5000000, warningThreshold: 80, criticalThreshold: 95, enabled: true },
  { category: 'Stationery', budgetAmount: 200000, warningThreshold: 80, criticalThreshold: 95, enabled: true },
  { category: 'Food', budgetAmount: 300000, warningThreshold: 80, criticalThreshold: 95, enabled: true },
];
