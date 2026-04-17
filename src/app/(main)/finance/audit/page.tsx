'use client';

import { useMemo, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import type { Income, Expense, BankAccount, PettyCashFloat, BudgetPeriod } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { getCurrentFiscalYear, calculateFinancialSnapshot, calculateStaffAccountabilities, calculateCashOnHand, filterByBudgetPeriod } from '@/lib/finance-utils';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart3, Download, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, 
  PieChart, LineChart, DollarSign, Wallet, CreditCard, Target, FileText,
  Calendar, Filter, Printer, RefreshCw, AlertTriangle, CheckCircle2, Building2
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, isWithinInterval } from 'date-fns';

interface ReportSection {
  id: string;
  title: string;
  description: string;
}

const reportSections: ReportSection[] = [
  { id: 'executive', title: 'Executive Summary', description: 'High-level KPIs and financial health indicators' },
  { id: 'monthly', title: 'Monthly Trend', description: 'Month-by-month analysis' },
  { id: 'cashflow', title: 'Cash Flow', description: 'Cash inflows and outflows' },
  { id: 'budget', title: 'Budget vs Actual', description: 'Budget utilization analysis' },
  { id: 'income', title: 'Income Analysis', description: 'Income by source and funding type' },
  { id: 'expenses', title: 'Expenses Analysis', description: 'Expenses by category and department' },
  { id: 'assets', title: 'Assets Register', description: 'Organization assets and values' },
];

function generateExcelData(allIncome: Income[], allExpenses: Expense[], bankAccounts: BankAccount[], pettyCash: PettyCashFloat[], fiscalYear: { name: string; start: Date; end: Date }) {
  const auditData: Record<string, any>[] = [];
  
  // Sheet 1: Executive Summary
  const snapshot = calculateFinancialSnapshot(allIncome, allExpenses);
  const cashOnHand = calculateCashOnHand(bankAccounts, pettyCash);
  
  // Sheet 2: Detailed Income
  allIncome?.forEach(i => {
    const date = new Date(i.dateReceived);
    auditData.push({
      'Sheet': 'Income',
      'Date': format(date, 'yyyy-MM-dd'),
      'Type': 'Income',
      'Description': i.source,
      'Category': i.type || 'Other',
      'Amount': i.amount || 0,
      'Status': i.status || 'Approved',
      'Notes': i.notes || '',
      'Fiscal Year': fiscalYear.name,
      'Month': format(date, 'MMMM yyyy'),
    });
  });

  // Sheet 3: Detailed Expenses
  allExpenses?.forEach(e => {
    const date = new Date(e.date);
    auditData.push({
      'Sheet': 'Expenses',
      'Date': format(date, 'yyyy-MM-dd'),
      'Type': 'Expense',
      'Description': e.title,
      'Category': e.items?.[0]?.category || 'General',
      'Amount': e.totalAmount || 0,
      'Status': e.status,
      'Payee': e.userName || e.submittedFor || 'Staff',
      'Notes': e.notes || '',
      'Fiscal Year': fiscalYear.name,
      'Month': format(date, 'MMMM yyyy'),
    });
  });

  // Sheet 4: Bank Accounts
  bankAccounts?.forEach(b => {
    auditData.push({
      'Sheet': 'Bank Accounts',
      'Account Name': b.name,
      'Bank': b.bankName,
      'Account Number': b.accountNumber || 'N/A',
      'Currency': b.currency,
      'Opening Balance': b.openingBalance || 0,
      'Current Balance': b.currentBalance || 0,
      'Status': b.isActive ? 'Active' : 'Inactive',
    });
  });

  return auditData;
}

export default function AuditReportsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState(format(new Date(), 'yyyy'));
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [activeSection, setActiveSection] = useState('executive');
  const [isGenerating, setIsGenerating] = useState(false);

  const financeRoles = ['Executive Director', 'Media & Finance Lead', 'Administrator', 'Media & Communications Lead'];
  const canView = profile && financeRoles.includes(profile.role);

  const fiscalYear = useMemo(() => ({
    name: `FY ${selectedYear}`,
    start: new Date(parseInt(selectedYear), 0, 1),
    end: new Date(parseInt(selectedYear), 11, 31),
  }), [selectedYear]);

  const incomeQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'income'), orderBy('dateReceived', 'desc')) : null, [firestore]);
  const expensesQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'expenses'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const bankAccountsQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'bankAccounts'), orderBy('name')) : null, [firestore]);
  const pettyCashQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'pettyCashFloats')) : null, [firestore]);
  const budgetsQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'budgets'), orderBy('startDate', 'desc')) : null, [firestore]);

  const { data: allIncome, isLoading: incomeLoading } = useCollection<Income>(incomeQuery);
  const { data: allExpenses, isLoading: expensesLoading } = useCollection<Expense>(expensesQuery);
  const { data: bankAccounts } = useCollection<BankAccount>(bankAccountsQuery);
  const { data: pettyCash } = useCollection<PettyCashFloat>(pettyCashQuery);
  const { data: budgets } = useCollection<BudgetPeriod>(budgetsQuery);

  const isLoading = incomeLoading || expensesLoading;

  // Filter data by fiscal year
  const fyIncome = useMemo(() => 
    allIncome?.filter(i => isWithinInterval(new Date(i.dateReceived), { start: fiscalYear.start, end: fiscalYear.end })) || [], 
  [allIncome, fiscalYear]);

  const fyExpenses = useMemo(() => 
    allExpenses?.filter(e => 
      isWithinInterval(new Date(e.date), { start: fiscalYear.start, end: fiscalYear.end }) &&
      (e.status === 'Disbursed' || e.status === 'Acknowledged')
    ) || [], 
  [allExpenses, fiscalYear]);

  // Monthly breakdown
  const monthlyData = useMemo(() => {
    const months = eachMonthOfInterval({ start: fiscalYear.start, end: fiscalYear.end });
    return months.map(month => {
      const mStart = startOfMonth(month);
      const mEnd = endOfMonth(month);
      const monthIncome = allIncome?.filter(i => {
        const d = new Date(i.dateReceived);
        return d >= mStart && d <= mEnd && isWithinInterval(d, fiscalYear);
      }) || [];
      const monthExpenses = allExpenses?.filter(e => {
        const d = new Date(e.date);
        return d >= mStart && d <= mEnd && isWithinInterval(d, fiscalYear) && 
          (e.status === 'Disbursed' || e.status === 'Acknowledged');
      }) || [];
      return {
        month: format(month, 'MMM'),
        fullMonth: format(month, 'MMMM yyyy'),
        income: monthIncome.reduce((s, i) => s + Number(i.amount || 0), 0),
        expenses: monthExpenses.reduce((s, e) => s + Number(e.totalAmount || 0), 0),
        transactions: monthIncome.length + monthExpenses.length,
      };
    });
  }, [allIncome, allExpenses, fiscalYear]);

  // Executive summary data
  const executiveSummary = useMemo(() => {
    if (!allIncome || !allExpenses) return null;
    const snapshot = calculateFinancialSnapshot(allIncome, allExpenses);
    const cashOnHand = calculateCashOnHand(bankAccounts, pettyCash);
    const staffAccountabilities = calculateStaffAccountabilities(allExpenses || []);
    
    const totalIncome = fyIncome.reduce((s, i) => s + Number(i.amount || 0), 0);
    const totalExpenses = fyExpenses.reduce((s, e) => s + Number(e.totalAmount || 0), 0);
    const totalAssets = bankAccounts?.reduce((s, b) => s + Number(b.currentBalance || 0), 0) || 0;
    const pettyCashTotal = pettyCash?.reduce((s, p) => s + Number(p.currentBalance || 0), 0) || 0;
    const fundsHeldByStaff = snapshot.fundsHeldByStaff;
    
    return {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      cashOnHand: totalAssets + pettyCashTotal,
      totalAssets,
      pettyCashTotal,
      fundsHeldByStaff,
      pendingExpenses: snapshot.pendingExpenses,
      approvedNotDisbursed: snapshot.approvedNotDisbursed,
      staffWithFunds: snapshot.fundsHeldByStaff > 0,
      incomeGrowthRate: monthlyData.length > 1 ? 
        ((monthlyData[monthlyData.length - 1]?.income || 0) - (monthlyData[monthlyData.length - 2]?.income || 0)) / 
        ((monthlyData[monthlyData.length - 2]?.income || 1) * 100) : 0,
      expenseGrowthRate: monthlyData.length > 1 ?
        ((monthlyData[monthlyData.length - 1]?.expenses || 0) - (monthlyData[monthlyData.length - 2]?.expenses || 0)) /
        ((monthlyData[monthlyData.length - 2]?.expenses || 1) * 100) : 0,
    };
  }, [allIncome, allExpenses, bankAccounts, pettyCash, fyIncome, fyExpenses, monthlyData]);

  // Budget utilization
  const budgetUtilization = useMemo(() => {
    const activeBudget = budgets?.find(b => b.isActive);
    if (!activeBudget || !allExpenses) return null;
    const periodExpenses = filterByBudgetPeriod(allExpenses, activeBudget);
    const spent = periodExpenses.reduce((s, e) => s + Number(e.totalAmount || 0), 0);
    const budgeted = activeBudget.totalBudget;
    return {
      budgeted,
      spent,
      remaining: budgeted - spent,
      percentUsed: budgeted > 0 ? (spent / budgeted) * 100 : 0,
      categoryBreakdown: activeBudget.categoryLimits ? 
        Object.entries(activeBudget.categoryLimits).map(([cat, limit]) => ({
          category: cat,
          budgeted: Number(limit),
          spent: periodExpenses.filter(e => 
            e.items?.some(i => i.category === cat)
          ).reduce((s, e) => s + Number(e.totalAmount || 0), 0),
        })) : [],
    };
  }, [budgets, allExpenses]);

  // Export to Excel-compatible CSV
  const handleExportAudit = async () => {
    setIsGenerating(true);
    try {
      if (!allIncome || !allExpenses) {
        toast({ variant: 'destructive', title: 'Error', description: 'Data not loaded yet.' });
        return;
      }

      const allData: string[] = [];
      
      // Section 1: Executive Summary
      allData.push('OMUTO FOUNDATION - FINANCIAL AUDIT REPORT');
      allData.push(`Fiscal Year: ${fiscalYear.name}`);
      allData.push(`Generated: ${format(new Date(), 'PPP')}`);
      allData.push('');
      allData.push('EXECUTIVE SUMMARY');
      allData.push(`Total Income,${formatCurrency(executiveSummary?.totalIncome || 0)}`);
      allData.push(`Total Expenses,${formatCurrency(executiveSummary?.totalExpenses || 0)}`);
      allData.push(`Net Balance,${formatCurrency(executiveSummary?.netBalance || 0)}`);
      allData.push(`Cash on Hand,${formatCurrency(executiveSummary?.cashOnHand || 0)}`);
      allData.push(`Total Assets,${formatCurrency(executiveSummary?.totalAssets || 0)}`);
      allData.push(`Funds Held by Staff,${formatCurrency(executiveSummary?.fundsHeldByStaff || 0)}`);
      allData.push(`Pending Expenses,${formatCurrency(executiveSummary?.pendingExpenses || 0)}`);
      allData.push(`Approved Not Disbursed,${formatCurrency(executiveSummary?.approvedNotDisbursed || 0)}`);
      allData.push('');

      // Section 2: Monthly Trend
      allData.push('MONTHLY TREND ANALYSIS');
      allData.push('Month,Income,Expenses,Net,Transactions');
      monthlyData.forEach(m => {
        allData.push(`${m.month},${formatCurrency(m.income)},${formatCurrency(m.expenses)},${formatCurrency(m.income - m.expenses)},${m.transactions}`);
      });
      allData.push('');

      // Section 3: Income Details
      allData.push('INCOME DETAILS');
      allData.push('Date,Source,Type,Amount,Status,Notes');
      fyIncome.forEach(i => {
        allData.push(`${i.dateReceived},${i.source},${i.type},${i.amount},${i.status},${i.notes || ''}`);
      });
      allData.push('');

      // Section 4: Expense Details
      allData.push('EXPENSE DETAILS');
      allData.push('Date,Description,Category,Amount,Status,Payee');
      fyExpenses.forEach(e => {
        const cat = e.items?.[0]?.category || 'General';
        allData.push(`${e.date},${e.title},${cat},${e.totalAmount},${e.status},${e.userName || ''}`);
      });
      allData.push('');

      // Section 5: Bank Accounts
      allData.push('BANK ACCOUNTS');
      allData.push('Account,Bank,Currency,Opening,Current,Status');
      bankAccounts?.forEach(b => {
        allData.push(`${b.name},${b.bankName},${b.currency},${b.openingBalance},${b.currentBalance},${b.isActive ? 'Active' : 'Inactive'}`);
      });
      allData.push('');

      // Section 6: Petty Cash
      allData.push('PETTY CASH FLOATS');
      allData.push('Float Name,Current Balance,Status');
      pettyCash?.forEach(p => {
        allData.push(`${p.name},${p.currentBalance},Active`);
      });
      allData.push('');

      // Section 7: Income by Source
      allData.push('INCOME BY SOURCE');
      const incomeBySource: Record<string, number> = {};
      fyIncome.forEach(i => {
        const type = i.type || 'Other';
        incomeBySource[type] = (incomeBySource[type] || 0) + Number(i.amount || 0);
      });
      Object.entries(incomeBySource).forEach(([source, amount]) => {
        allData.push(`${source},${formatCurrency(amount)}`);
      });
      allData.push('');

      // Section 8: Expenses by Category
      allData.push('EXPENSES BY CATEGORY');
      const expensesByCategory: Record<string, number> = {};
      fyExpenses.forEach(e => {
        e.items?.forEach(item => {
          expensesByCategory[item.category] = (expensesByCategory[item.category] || 0) + Number(item.amount || 0);
        });
      });
      Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1]).forEach(([cat, amount]) => {
        allData.push(`${cat},${formatCurrency(amount)}`);
      });
      allData.push('');

      // Section 9: Budget vs Actual
      if (budgetUtilization) {
        allData.push('BUDGET VS ACTUAL');
        allData.push(`Total Budget,${formatCurrency(budgetUtilization.budgeted)}`);
        allData.push(`Total Spent,${formatCurrency(budgetUtilization.spent)}`);
        allData.push(`Remaining,${formatCurrency(budgetUtilization.remaining)}`);
        allData.push(`% Used,${budgetUtilization.percentUsed.toFixed(1)}%`);
        allData.push('');
        allData.push('BY CATEGORY');
        allData.push('Category,Budgeted,Spent,Remaining,% Used');
        budgetUtilization.categoryBreakdown.forEach(cat => {
          const remaining = cat.budgeted - cat.spent;
          const pct = cat.budgeted > 0 ? (cat.spent / cat.budgeted) * 100 : 0;
          allData.push(`${cat.category},${cat.budgeted},${cat.spent},${remaining},${pct.toFixed(1)}%`);
        });
      }

      const blob = new Blob([allData.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `omuto_financial_audit_${fiscalYear.name.replace(' ', '_')}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast({ title: 'Audit Report Exported', description: 'Full financial audit data ready for auditors.' });
    } catch (e) {
      console.error('Export error:', e);
      toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not generate report.' });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!canView) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground">You need finance role to view audit reports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-500" />
            Financial Audit Reports
          </h1>
          <p className="text-muted-foreground text-sm">Comprehensive financial analysis for decision-making and auditing.</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-2">
            <Label className="text-sm">FY</Label>
            <Input 
              type="number" 
              value={selectedYear} 
              onChange={e => setSelectedYear(e.target.value)}
              className="w-24 h-9"
            />
          </div>
          <Button onClick={handleExportAudit} disabled={isGenerating} className="gap-2">
            {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export Audit
          </Button>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="flex flex-wrap gap-2 pb-4 border-b">
        {reportSections.map(section => (
          <Button
            key={section.id}
            variant={activeSection === section.id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveSection(section.id)}
            className="text-xs"
          >
            {section.title}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
        <>
          {/* EXECUTIVE SUMMARY */}
          {activeSection === 'executive' && executiveSummary && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="border-emerald-200 bg-emerald-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                      <p className="text-xs font-medium text-emerald-700">Total Income</p>
                    </div>
                    <p className="text-xl font-bold text-emerald-700">{formatCurrency(executiveSummary.totalIncome)}</p>
                  </CardContent>
                </Card>
                <Card className="border-rose-200 bg-rose-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <ArrowDownRight className="h-4 w-4 text-rose-500" />
                      <p className="text-xs font-medium text-rose-700">Total Expenses</p>
                    </div>
                    <p className="text-xl font-bold text-rose-700">{formatCurrency(executiveSummary.totalExpenses)}</p>
                  </CardContent>
                </Card>
                <Card className={executiveSummary.netBalance >= 0 ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      {executiveSummary.netBalance >= 0 ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-red-500" />}
                      <p className="text-xs font-medium">Net Balance</p>
                    </div>
                    <p className={cn("text-xl font-bold", executiveSummary.netBalance >= 0 ? "text-green-700" : "text-red-700")}>
                      {formatCurrency(executiveSummary.netBalance)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Wallet className="h-4 w-4 text-blue-500" />
                      <p className="text-xs font-medium text-blue-700">Cash on Hand</p>
                    </div>
                    <p className="text-xl font-bold text-blue-700">{formatCurrency(executiveSummary.cashOnHand)}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">Assets (Bank)</p>
                    <p className="text-lg font-bold">{formatCurrency(executiveSummary.totalAssets)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">Petty Cash</p>
                    <p className="text-lg font-bold">{formatCurrency(executiveSummary.pettyCashTotal)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">Held by Staff</p>
                    <p className="text-lg font-bold text-amber-600">{formatCurrency(executiveSummary.fundsHeldByStaff)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">Pending Approval</p>
                    <p className="text-lg font-bold text-yellow-600">{formatCurrency(executiveSummary.pendingExpenses)}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* MONTHLY TREND */}
          {activeSection === 'monthly' && (
            <Card>
              <CardHeader>
                <CardTitle>Monthly Trend Analysis - {fiscalYear.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3">Month</th>
                        <th className="text-right py-2 px-3 text-emerald-600">Income</th>
                        <th className="text-right py-2 px-3 text-rose-600">Expenses</th>
                        <th className="text-right py-2 px-3">Net</th>
                        <th className="text-right py-2 px-3">Txns</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyData.map(m => (
                        <tr key={m.month} className="border-b hover:bg-muted/30">
                          <td className="py-2 px-3 font-medium">{m.fullMonth}</td>
                          <td className="py-2 px-3 text-right text-emerald-600">{formatCurrency(m.income)}</td>
                          <td className="py-2 px-3 text-right text-rose-600">{formatCurrency(m.expenses)}</td>
                          <td className={cn("py-2 px-3 text-right font-medium", m.income - m.expenses >= 0 ? "text-green-600" : "text-red-600")}>
                            {formatCurrency(m.income - m.expenses)}
                          </td>
                          <td className="py-2 px-3 text-right text-muted-foreground">{m.transactions}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="font-bold bg-muted/50">
                        <td className="py-2 px-3">TOTAL</td>
                        <td className="py-2 px-3 text-right text-emerald-600">{formatCurrency(monthlyData.reduce((s, m) => s + m.income, 0))}</td>
                        <td className="py-2 px-3 text-right text-rose-600">{formatCurrency(monthlyData.reduce((s, m) => s + m.expenses, 0))}</td>
                        <td className="py-2 px-3 text-right">{formatCurrency(monthlyData.reduce((s, m) => s + m.income - m.expenses, 0))}</td>
                        <td className="py-2 px-3 text-right">{monthlyData.reduce((s, m) => s + m.transactions, 0)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* CASH FLOW */}
          {activeSection === 'cashflow' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" /> Bank Accounts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {bankAccounts?.map(b => (
                      <div key={b.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                        <div>
                          <p className="font-medium">{b.name}</p>
                          <p className="text-xs text-muted-foreground">{b.bankName} • {b.currency}</p>
                        </div>
                        <p className="font-bold text-green-600">{formatCurrency(b.currentBalance || 0)}</p>
                      </div>
                    ))}
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg font-bold border-t">
                      <span>Total Bank</span>
                      <span className="text-green-600">{formatCurrency(bankAccounts?.reduce((s, b) => s + Number(b.currentBalance || 0), 0) || 0)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" /> Petty Cash
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pettyCash?.map(p => (
                      <div key={p.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                        <span className="font-medium">{p.name}</span>
                        <span className="font-bold">{formatCurrency(p.currentBalance || 0)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg font-bold border-t">
                      <span>Total Petty Cash</span>
                      <span className="text-amber-600">{formatCurrency(pettyCash?.reduce((s, p) => s + Number(p.currentBalance || 0), 0) || 0)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* BUDGET VS ACTUAL */}
          {activeSection === 'budget' && budgetUtilization && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" /> Budget vs Actual - {fiscalYear.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">Budget</p>
                      <p className="text-xl font-bold">{formatCurrency(budgetUtilization.budgeted)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Spent</p>
                      <p className="text-xl font-bold text-rose-600">{formatCurrency(budgetUtilization.spent)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Remaining</p>
                      <p className={cn("text-xl font-bold", budgetUtilization.remaining >= 0 ? "text-green-600" : "text-red-600")}>
                        {formatCurrency(budgetUtilization.remaining)}
                      </p>
                    </div>
                  </div>
                  {budgetUtilization.categoryBreakdown.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-3">By Category</h4>
                      <div className="space-y-2">
                        {budgetUtilization.categoryBreakdown.map(cat => (
                          <div key={cat.category} className="grid grid-cols-4 gap-2 text-sm">
                            <span className="font-medium">{cat.category}</span>
                            <span className="text-right">{formatCurrency(cat.budgeted)}</span>
                            <span className="text-right">{formatCurrency(cat.spent)}</span>
                            <span className={cn("text-right", cat.spent > cat.budgeted ? "text-red-600" : "text-green-600")}>
                              {formatCurrency(cat.budgeted - cat.spent)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* INCOME ANALYSIS */}
          {activeSection === 'income' && (
            <Card>
              <CardHeader>
                <CardTitle>Income by Source - {fiscalYear.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const incomeBySource: Record<string, number> = {};
                  fyIncome.forEach(i => {
                    const type = i.type || 'Other';
                    incomeBySource[type] = (incomeBySource[type] || 0) + Number(i.amount || 0);
                  });
                  const sorted = Object.entries(incomeBySource).sort((a, b) => b[1] - a[1]);
                  return (
                    <div className="space-y-2">
                      {sorted.map(([source, amount]) => (
                        <div key={source} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                          <span className="font-medium">{source}</span>
                          <span className="font-bold text-emerald-600">{formatCurrency(amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg font-bold border-t">
                        <span>Total</span>
                        <span className="text-emerald-600">{formatCurrency(sorted.reduce((s, [,a]) => s + a, 0))}</span>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* EXPENSES ANALYSIS */}
          {activeSection === 'expenses' && (
            <Card>
              <CardHeader>
                <CardTitle>Expenses by Category - {fiscalYear.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const expensesByCategory: Record<string, number> = {};
                  fyExpenses.forEach(e => {
                    e.items?.forEach(item => {
                      expensesByCategory[item.category] = (expensesByCategory[item.category] || 0) + Number(item.amount || 0);
                    });
                  });
                  const sorted = Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1]);
                  return (
                    <div className="space-y-2">
                      {sorted.map(([cat, amount]) => (
                        <div key={cat} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                          <span className="font-medium">{cat}</span>
                          <span className="font-bold text-rose-600">{formatCurrency(amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center p-3 bg-rose-50 rounded-lg font-bold border-t">
                        <span>Total</span>
                        <span className="text-rose-600">{formatCurrency(sorted.reduce((s, [,a]) => s + a, 0))}</span>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* ASSETS REGISTER */}
          {activeSection === 'assets' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" /> Assets Register - {fiscalYear.name}
                </CardTitle>
                <CardDescription>Organization assets with monetary values</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-3">Bank Accounts</h4>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="py-2">Account Name</th>
                          <th className="py-2">Bank</th>
                          <th className="py-2">Currency</th>
                          <th className="py-2 text-right">Opening</th>
                          <th className="py-2 text-right">Current</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bankAccounts?.map(b => (
                          <tr key={b.id} className="border-b">
                            <td className="py-2">{b.name}</td>
                            <td className="py-2 text-muted-foreground">{b.bankName}</td>
                            <td className="py-2">{b.currency}</td>
                            <td className="py-2 text-right">{formatCurrency(b.openingBalance || 0)}</td>
                            <td className="py-2 text-right font-medium">{formatCurrency(b.currentBalance || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="font-bold bg-muted/50">
                          <td className="py-2" colSpan={3}>Total</td>
                          <td className="py-2 text-right">{formatCurrency(bankAccounts?.reduce((s, b) => s + Number(b.openingBalance || 0), 0) || 0)}</td>
                          <td className="py-2 text-right">{formatCurrency(bankAccounts?.reduce((s, b) => s + Number(b.currentBalance || 0), 0) || 0)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Petty Cash Floats</h4>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="py-2">Float Name</th>
                          <th className="py-2">Status</th>
                          <th className="py-2 text-right">Current Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pettyCash?.map(p => (
                          <tr key={p.id} className="border-b">
                            <td className="py-2">{p.name}</td>
                            <td className="py-2 text-green-600">Active</td>
                            <td className="py-2 text-right font-medium">{formatCurrency(p.currentBalance || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="font-bold bg-muted/50">
                          <td className="py-2" colSpan={2}>Total</td>
                          <td className="py-2 text-right">{formatCurrency(pettyCash?.reduce((s, p) => s + Number(p.currentBalance || 0), 0) || 0)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">TOTAL ASSETS</span>
                      <span className="text-2xl font-bold text-amber-600">
                        {formatCurrency(
                          (bankAccounts?.reduce((s, b) => s + Number(b.currentBalance || 0), 0) || 0) +
                          (pettyCash?.reduce((s, p) => s + Number(p.currentBalance || 0), 0) || 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}