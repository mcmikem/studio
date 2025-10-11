"use client"

import type { User, Expense, Activity } from "@/lib/types"
import {
  ArrowRight,
  Check,
  DollarSign,
  FolderKanban,
  Target,
  VenetianMask,
  X,
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
import { TeamToday } from "./team-today"
import { formatDateSafe } from "@/lib/utils"
import { DashboardGrid } from "./dashboard-grid"
import { useToast } from "@/hooks/use-toast"
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { createAlert } from "@/ai/flows/create-alert-flow"
import { ManagementQuickLinks } from "./management-quick-links"
import { Badge } from "../ui/badge"
import { DashboardHeader } from "./dashboard-header"
import { doc, collection, query, where, orderBy, Timestamp } from "firebase/firestore"

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    minimumFractionDigits: 0,
  }).format(value)
}

function FinancialOverview({ activities }: { activities: Activity[] | null }) {
  const monthlyBudget = 2000000 // Mock budget for now

  const { totalSpent, totalValue } = useMemo(() => {
    if (!activities) return { totalSpent: 0, totalValue: 0 };
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthlyActivities = activities.filter(act => act.loggedAt.toDate() >= startOfMonth);

    const spent = monthlyActivities.reduce((sum, activity) => sum + activity.actualCost, 0);
    const value = monthlyActivities.reduce((sum, activity) => sum + activity.totalValue, 0);
    
    return { totalSpent: spent, totalValue: value };
  }, [activities]);

  const remainingBudget = monthlyBudget - totalSpent;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="flex flex-col justify-between">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <DollarSign />
            Monthly Spending
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{formatCurrency(totalSpent)}</p>
          <p className="text-sm text-muted-foreground">
            of {formatCurrency(monthlyBudget)} spent
          </p>
        </CardContent>
      </Card>
      <Card className="flex flex-col justify-between">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-500">
            <Target />
            Value Generated
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{formatCurrency(totalValue)}</p>
          <p className="text-sm text-muted-foreground">
            from this month's activities
          </p>
        </CardContent>
      </Card>
      <Card className="flex flex-col justify-between">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-500">
            <VenetianMask />
            Remaining Budget
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">
            {formatCurrency(remainingBudget)}
          </p>
          <p className="text-sm text-muted-foreground">for the rest of the month</p>
        </CardContent>
      </Card>
    </div>
  )
}

function PaymentQueue({ expenses }: { expenses: Expense[] | null }) {
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

  const handleStatusUpdate = async (expense: Expense, status: 'Approved' | 'Rejected' | 'Cleared') => {
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
          type: status === 'Approved' ? 'Info' : status === 'Cleared' ? 'Info' : 'Urgent',
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

  const renderTable = (expenses: Expense[], type: 'pending' | 'approved') => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {expenses && expenses.length > 0 ? (
          expenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell>
                <p className="font-medium">{expense.userName}</p>
                <p className="text-xs text-muted-foreground">{expense.title}</p>
              </TableCell>
              <TableCell>{formatCurrency(expense.totalAmount)}</TableCell>
              <TableCell className="text-muted-foreground text-xs">{formatDateSafe(expense.date, 'dateOnly')}</TableCell>
              <TableCell className="text-right">
                {type === 'pending' && (
                  <div className="flex gap-2 justify-end">
                    <Button size="icon" variant="ghost" className="text-green-500 hover:text-green-600" onClick={() => handleStatusUpdate(expense, 'Approved')}><Check className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => handleStatusUpdate(expense, 'Rejected')}><X className="h-4 w-4" /></Button>
                  </div>
                )}
                {type === 'approved' && (
                  <Button size="sm" onClick={() => handleStatusUpdate(expense, 'Cleared')}>
                    <Check className="mr-2 h-4 w-4" />
                    Mark as Cleared
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))
        ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center h-24">
                The {type === 'pending' ? 'approval' : 'payment'} queue is empty.
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
          <h3 className="font-semibold mb-2 flex items-center gap-2"><Badge variant="outline" className="border-green-500 bg-green-500/10 text-green-500">Awaiting Payment</Badge></h3>
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

  const activitiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    return query(
      collection(firestore, "activities"),
      where("loggedAt", ">=", Timestamp.fromDate(startOfMonth))
    );
  }, [firestore]);
  const { data: activities } = useCollection<Activity>(activitiesQuery);

  const pendingExpensesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'expenses'), where('status', 'in', ['Pending', 'Approved']), orderBy('createdAt', 'desc')) : null, [firestore]);
  const { data: pendingExpenses } = useCollection<Expense>(pendingExpensesQuery);


  return (
    <div className="flex flex-col gap-6">
       <DashboardHeader profile={profile} />
       <DashboardGrid className="lg:grid-cols-3 mt-0">
        <div className="col-span-full">
           <Card>
            <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
                <CardDescription>
                A summary of this month's spending and value generation.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <FinancialOverview activities={activities} />
            </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-2 flex flex-col gap-6">
            <PaymentQueue expenses={pendingExpenses} />
             <Card>
              <CardHeader>
                <CardTitle>Media Asset Library</CardTitle>
                <CardDescription>
                  A central place for all photos, videos, and brand assets.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center text-center p-4 border-2 border-dashed rounded-lg h-full min-h-48">
                  <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg">Under Development</h3>
                  <p className="text-muted-foreground text-sm">
                    A searchable library for all media content is coming soon.
                  </p>
                </div>
              </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1 flex flex-col gap-6">
            <DailyActions />
            <TeamToday />
            <ManagementQuickLinks />
        </div>
      </DashboardGrid>
    </div>
  )
}
