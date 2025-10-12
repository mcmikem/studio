
"use client"

import type { User, Expense, Activity, ImpactMetric, Income } from "@/lib/types"
import {
  ArrowRight,
  Check,
  DollarSign,
  FolderKanban,
  VenetianMask,
  X,
  Wallet,
  Camera,
  Wand,
  CheckCheck,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card"
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase"
import { useMemo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table"
import { Button } from "../ui/button"
import Link from "next/link"
import { DailyActions } from "./daily-actions"
import { formatDateSafe } from "@/lib/utils"
import { DashboardGrid } from "./dashboard-grid"
import { useToast } from "@/hooks/use-toast"
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { createAlert } from "@/ai/flows/create-alert-flow"
import { ManagementQuickLinks } from "./management-quick-links"
import { Badge } from "../ui/badge"
import { DashboardHeader } from "./dashboard-header"
import { doc, collection, query, where, orderBy, Timestamp, limit } from "firebase/firestore"
import { Progress } from "../ui/progress"
import { startOfMonth } from "date-fns"
import { TeamDeployment } from "./team-deployment"
import { Skeleton } from "../ui/skeleton"

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    minimumFractionDigits: 0,
  }).format(value)
}

function MediaOpportunities({ activities, isLoading }: { activities: Activity[] | null, isLoading: boolean }) {
    const opportunities = useMemo(() => {
        if (!activities) return [];
        // The value for "Capturing content for fundraising" is 50000.
        // We can check if indirectValue is not zero, but for a more robust check,
        // it would be better if the selected multipliers were stored.
        // For now, we'll assume any activity with indirect value has media potential.
        return activities.filter(act => act.indirectValue && act.indirectValue > 0);
    }, [activities]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Camera /> Media Opportunities</CardTitle>
                <CardDescription>
                    A feed of recent field activities logged with media content.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {isLoading && (
                        Array.from({ length: 3 }).map((_, i) => (
                             <div key={i} className="flex items-center justify-between p-3 rounded-md bg-muted">
                                <div className="space-y-1">
                                    <Skeleton className="h-5 w-48" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                                <Skeleton className="h-9 w-28" />
                            </div>
                        ))
                    )}
                    {!isLoading && opportunities.length > 0 ? (
                        opportunities.map(act => (
                            <div key={act.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-md bg-muted">
                                <div>
                                    <p className="font-semibold">{act.title}</p>
                                    <p className="text-xs text-muted-foreground">Logged by {act.userName} - {formatDateSafe(act.loggedAt)}</p>
                                </div>
                                <Button asChild size="sm" className="mt-2 sm:mt-0">
                                    <Link href={`/impact-story?activityId=${act.id}`}>
                                        <Wand className="mr-2 h-4 w-4" />
                                        Generate Story
                                    </Link>
                                </Button>
                            </div>
                        ))
                    ) : (
                        !isLoading && (
                             <div className="flex flex-col items-center justify-center text-center p-4 border-2 border-dashed rounded-lg h-full min-h-48">
                                <Camera className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="font-semibold text-lg">No Media Opportunities</h3>
                                <p className="text-muted-foreground text-sm max-w-sm">
                                    No recent activities were logged with the "Capture Content" multiplier.
                                </p>
                            </div>
                        )
                    )}
                </div>
            </CardContent>
        </Card>
    );
}


function BudgetHealth({ expenses, income }: { expenses: Expense[] | null, income: Income[] | null }) {

    const { totalIncome, totalExpenses, cashBalance } = useMemo(() => {
        if (!income || !expenses) return { totalIncome: 0, totalExpenses: 0, cashBalance: 0 };
        
        const monthStart = startOfMonth(new Date());

        const currentMonthIncome = income
            .filter(i => i.dateReceived && new Date(i.dateReceived) >= monthStart)
            .reduce((sum, i) => sum + i.amount, 0);
        
        const currentMonthExpenses = expenses
            .filter(e => (e.status === 'Approved' || e.status === 'Disbursed' || e.status === 'Acknowledged') && e.createdAt && e.createdAt.toDate() >= monthStart)
            .reduce((sum, e) => sum + e.totalAmount, 0);

        const allTimeIncome = income.reduce((sum, i) => sum + i.amount, 0);
        const allTimeClearedExpenses = expenses.filter(e => e.status === 'Acknowledged' || e.status === 'Disbursed').reduce((sum, e) => sum + e.totalAmount, 0);

        return { 
            totalIncome: currentMonthIncome, 
            totalExpenses: currentMonthExpenses,
            cashBalance: allTimeIncome - allTimeClearedExpenses
        };
    }, [income, expenses]);
    
    const pendingApprovals = expenses?.filter(e => e.status === 'Pending').reduce((sum, e) => sum + e.totalAmount, 0) || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Wallet /> Budget Health</CardTitle>
        <CardDescription>A real-time overview of the organization's cash flow.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-sm font-medium text-muted-foreground">Cash Balance</p>
            <p className="text-3xl font-bold">{formatCurrency(cashBalance)}</p>
        </div>
        <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-sm font-medium text-muted-foreground">Income (This Month)</p>
            <p className="text-3xl font-bold text-green-500">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-sm font-medium text-muted-foreground">Expenses (This Month)</p>
            <p className="text-3xl font-bold text-red-500">{formatCurrency(totalExpenses)}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function FinancialQueue({ expenses }: { expenses: Expense[] | null }) {
  const firestore = useFirestore()
  const { toast } = useToast()
  
  const { pendingExpenses, approvedExpenses } = useMemo(() => {
    if (!expenses) return { pendingExpenses: [], approvedExpenses: [] };
    return {
        pendingExpenses: expenses.filter(e => e.status === 'Pending'),
        approvedExpenses: expenses.filter(e => e.status === 'Approved'),
    }
  }, [expenses]);
  
  const { user: currentUser } = useUser();

  const handleStatusUpdate = async (expense: Expense, status: 'Approved' | 'Rejected' | 'Disbursed') => {
    if (!firestore || !currentUser) return;
    const expenseRef = doc(firestore, 'expenses', expense.id);
    try {
      await updateDocumentNonBlocking(expenseRef, { status });
      toast({
        title: `Expense ${status}`,
        description: `The expense from ${expense.userName} has been marked as ${status.toLowerCase()}.`,
      });

      if (expense.userId !== currentUser.uid) {
        await createAlert({
          type: 'Info',
          message: `Your expense for '${expense.title}' of ${formatCurrency(expense.totalAmount)} has been ${status.toLowerCase()}.`,
          priority: 'Medium',
          action: `/management/expenses?highlight=${expense.id}`,
          creatorId: currentUser.uid,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not update the expense status. Please try again.",
      });
    }
  };

  const renderTable = (expensesToRender: Expense[], type: 'pending' | 'approved') => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {expensesToRender && expensesToRender.length > 0 ? (
          expensesToRender.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell>
                <p className="font-medium">{expense.userName}</p>
                <p className="text-xs text-muted-foreground">{expense.title}</p>
              </TableCell>
              <TableCell>{formatCurrency(expense.totalAmount)}</TableCell>
              <TableCell className="text-right">
                {type === 'pending' && (
                  <div className="flex gap-2 justify-end">
                    <Button size="icon" variant="ghost" className="text-green-500 hover:text-green-600" onClick={() => handleStatusUpdate(expense, 'Approved')}><Check className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => handleStatusUpdate(expense, 'Rejected')}><X className="h-4 w-4" /></Button>
                  </div>
                )}
                {type === 'approved' && (
                  <Button size="sm" onClick={() => handleStatusUpdate(expense, 'Disbursed')}>
                    <CheckCheck className="mr-2 h-4 w-4" />
                    Mark Disbursed
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))
        ) : (
            <TableRow>
              <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                The {type === 'pending' ? 'approval' : 'disbursement'} queue is empty.
              </TableCell>
            </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Queue</CardTitle>
        <CardDescription>Approve new requests and clear approved payments.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2"><Badge variant="outline" className="border-yellow-500 bg-yellow-500/10 text-yellow-500">Pending Approval</Badge></h3>
          {renderTable(pendingExpenses, 'pending')}
        </div>
         <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2"><Badge variant="outline" className="border-blue-500 bg-blue-500/10 text-blue-500">Awaiting Disbursement</Badge></h3>
          {renderTable(approvedExpenses, 'approved')}
        </div>
        <Button asChild className="mt-4 w-full" variant="outline">
          <Link href="/management/expenses">
            View All Expense Reports <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

interface DashboardProps {
  profile: User;
}

export function MediaFinanceDashboard({ profile }: DashboardProps) {
  const firestore = useFirestore();

  const allExpensesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'expenses'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const { data: allExpenses } = useCollection<Expense>(allExpensesQuery);
  
  const allIncomeQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'income'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const { data: allIncome } = useCollection<Income>(allIncomeQuery);

  const activitiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'activities'), orderBy('loggedAt', 'desc'), limit(10));
  }, [firestore]);
  const { data: activities, isLoading: isLoadingActivities } = useCollection<Activity>(activitiesQuery);


  return (
    <>
       <DashboardGrid className="mt-6 lg:grid-cols-3">
        <div className="col-span-full">
            <BudgetHealth expenses={allExpenses} income={allIncome} />
        </div>
        <div className="lg:col-span-2 flex flex-col gap-6">
            <FinancialQueue expenses={allExpenses} />
             <MediaOpportunities activities={activities} isLoading={isLoadingActivities} />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-6">
            <DailyActions />
            <ManagementQuickLinks />
        </div>
      </DashboardGrid>
    </>
  )
}
